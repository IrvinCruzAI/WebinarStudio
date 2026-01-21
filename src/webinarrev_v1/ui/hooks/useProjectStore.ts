import { useState, useCallback, useEffect } from 'react';
import type {
  ProjectMetadata,
  DeliverableId,
  ValidationResult,
} from '../../contracts';
import {
  getAllProjects,
  createProject,
  getProject,
  updateProject,
  updateProjectStatus,
  updateDeliverablePointer,
  deleteProject,
  updateProjectSettings,
} from '../../store/metadataModel';
import type { CTA, AudienceTemperature } from '../../contracts';
import {
  readArtifact,
  atomicArtifactWrite,
  writeTranscript,
  loadAllArtifacts,
} from '../../store/storageService';
import { PipelineOrchestrator, PipelineProgress, PreflightBlockedError, PipelineValidationError } from '../../pipeline/orchestrator';
import { validateDeliverable } from '../../pipeline/validator';
import { generateDocx } from '../../export/docxGenerator';
import { generateExportZip } from '../../export/zipGenerator';
import { computeExportEligibility } from '../../export/eligibilityComputer';
import { safeGetRunIdFromArtifactId } from '../../contracts/ids';
import type { ProjectFormData } from '../modals/CreateProjectWizard';

export interface PipelineError {
  message: string;
  deliverableId?: DeliverableId;
  details?: string[];
  errorType?: 'api' | 'schema' | 'crosslink' | 'preflight' | 'unknown';
}

export interface ProjectStoreState {
  projects: ProjectMetadata[];
  selectedProjectId: string | null;
  artifacts: Map<DeliverableId, {
    content: unknown;
    validated: boolean;
    generated_at: number;
    edited_at?: number;
  }>;
  isLoading: boolean;
  isPipelineRunning: boolean;
  pipelineProgress: PipelineProgress[];
  error: string | null;
  pipelineError: PipelineError | null;
  orchestrator: PipelineOrchestrator | null;
}

export function useProjectStore() {
  const [state, setState] = useState<ProjectStoreState>({
    projects: [],
    selectedProjectId: null,
    artifacts: new Map(),
    isLoading: true,
    isPipelineRunning: false,
    pipelineProgress: [],
    error: null,
    pipelineError: null,
    orchestrator: null,
  });

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null, pipelineError: null }));
  }, []);

  const loadProjects = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const projects = getAllProjects();
      setState((s) => ({ ...s, projects, isLoading: false }));
    } catch (error) {
      setState((s) => ({
        ...s,
        error: error instanceof Error ? error.message : 'Failed to load projects',
        isLoading: false,
      }));
    }
  }, []);

  const loadProjectArtifacts = useCallback(async (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return;

    const artifacts = new Map<DeliverableId, {
      content: unknown;
      validated: boolean;
      generated_at: number;
      edited_at?: number;
    }>();

    const deliverableIds: DeliverableId[] = [
      'PREFLIGHT', 'WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8', 'WR9',
    ];

    for (const deliverableId of deliverableIds) {
      const pointer = project.deliverable_pointers[deliverableId];
      if (pointer) {
        try {
          const artifact = await readArtifact(pointer.artifact_id);
          if (artifact) {
            artifacts.set(deliverableId, {
              content: artifact.content,
              validated: artifact.validated,
              generated_at: artifact.generated_at,
              edited_at: artifact.edited_at,
            });
          }
        } catch (error) {
          console.warn(`Failed to load artifact ${deliverableId}:`, error);
        }
      }
    }

    setState((s) => ({ ...s, artifacts }));
  }, []);

  const selectProject = useCallback(async (projectId: string | null) => {
    setState((s) => ({ ...s, selectedProjectId: projectId, artifacts: new Map(), pipelineError: null, pipelineProgress: [] }));
    if (projectId) {
      await loadProjectArtifacts(projectId);
    }
  }, [loadProjectArtifacts]);

  const createNewProject = useCallback(async (formData: ProjectFormData) => {
    const projectId = `proj_${Date.now()}`;

    createProject(projectId, formData.title, {
      cta_mode: formData.ctaMode,
      audience_temperature: formData.audienceTemperature,
      webinar_length_minutes: formData.webinarLengthMinutes,
      client_name: formData.clientName || undefined,
      speaker_name: formData.speakerName || undefined,
      company_name: formData.companyName || undefined,
      contact_email: formData.contactEmail || undefined,
    });

    await writeTranscript(projectId, {
      build_transcript: formData.buildTranscript,
      intake_transcript: formData.intakeTranscript || undefined,
      operator_notes: formData.operatorNotes || undefined,
      created_at: Date.now(),
    });

    await loadProjects();
    await selectProject(projectId);

    return projectId;
  }, [loadProjects, selectProject]);

  const runPipeline = useCallback(async () => {
    if (!state.selectedProjectId) return;

    const project = getProject(state.selectedProjectId);
    if (!project) return;

    const runId = `run_${Date.now()}`;

    updateProject(state.selectedProjectId, { run_id: runId });

    const orchestrator = new PipelineOrchestrator((progress) => {
      setState((s) => ({
        ...s,
        pipelineProgress: [...s.pipelineProgress.filter(p => p.deliverableId !== progress.deliverableId), progress],
      }));
    });

    setState((s) => ({
      ...s,
      isPipelineRunning: true,
      pipelineProgress: [],
      error: null,
      pipelineError: null,
      orchestrator,
    }));

    updateProjectStatus(state.selectedProjectId, 'generating');
    await loadProjects();

    try {
      await orchestrator.runPipeline(state.selectedProjectId, runId);
      await loadProjects();
      await loadProjectArtifacts(state.selectedProjectId);
    } catch (error) {
      console.error('Pipeline failed:', error);

      let pipelineError: PipelineError;

      if (error instanceof PreflightBlockedError) {
        pipelineError = {
          message: 'Pipeline blocked: Missing required information',
          errorType: 'preflight',
          details: error.missingContext.map(mc => `${mc.field}: ${mc.why_it_matters}`),
        };
      } else if (error instanceof PipelineValidationError) {
        pipelineError = {
          message: error.message,
          deliverableId: error.deliverableId,
          details: error.validationErrors,
          errorType: error.errorType,
        };
      } else {
        pipelineError = {
          message: error instanceof Error ? error.message : 'Pipeline failed with unknown error',
          errorType: 'unknown',
          details: error instanceof Error && error.stack ? [error.stack.split('\n')[0]] : undefined,
        };
      }

      setState((s) => ({
        ...s,
        error: pipelineError.message,
        pipelineError,
      }));

      await loadProjects();
      await loadProjectArtifacts(state.selectedProjectId);
    } finally {
      setState((s) => ({ ...s, isPipelineRunning: false, orchestrator: null }));
    }
  }, [state.selectedProjectId, loadProjects, loadProjectArtifacts]);

  const editDeliverable = useCallback(async (
    deliverableId: DeliverableId,
    field: string,
    value: unknown
  ) => {
    if (!state.selectedProjectId) return;

    const artifact = state.artifacts.get(deliverableId);
    if (!artifact) return;

    let content: Record<string, unknown>;
    const pathParts = field.split(/[.\[\]]/).filter(Boolean);

    // If no field path is provided, replace the entire content
    if (pathParts.length === 0) {
      content = value as Record<string, unknown>;
    } else {
      // Navigate the path and update the specific field
      content = artifact.content as Record<string, unknown>;
      let target: Record<string, unknown> = content;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        const nextTarget = target[part];
        if (nextTarget && typeof nextTarget === 'object') {
          target = nextTarget as Record<string, unknown>;
        } else {
          return;
        }
      }

      const lastPart = pathParts[pathParts.length - 1];
      target[lastPart] = value;
    }

    const project = getProject(state.selectedProjectId);
    if (!project) return;

    const pointer = project.deliverable_pointers[deliverableId];
    if (!pointer) return;

    const runId = safeGetRunIdFromArtifactId(pointer.artifact_id);
    if (!runId) {
      console.error('[editDeliverable] Invalid artifact_id:', pointer.artifact_id);
      return;
    }

    await atomicArtifactWrite(
      state.selectedProjectId,
      runId,
      deliverableId,
      content,
      false
    );

    updateDeliverablePointer(state.selectedProjectId, deliverableId, {
      ...pointer,
      validated: false,
      edited_at: Date.now(),
    });

    setState((s) => {
      const newArtifacts = new Map(s.artifacts);
      newArtifacts.set(deliverableId, {
        ...artifact,
        content,
        validated: false,
        edited_at: Date.now(),
      });
      return { ...s, artifacts: newArtifacts };
    });
  }, [state.selectedProjectId, state.artifacts]);

  const revalidateDeliverable = useCallback(async (
    deliverableId: DeliverableId
  ): Promise<ValidationResult> => {
    const artifact = state.artifacts.get(deliverableId);
    if (!artifact) return { ok: false, errors: ['Artifact not found'] };

    const dependencies = new Map<DeliverableId, unknown>();
    state.artifacts.forEach((a, id) => {
      dependencies.set(id, a.content);
    });

    const result = await validateDeliverable(deliverableId, artifact.content, dependencies);

    if (!state.selectedProjectId) return result;

    const project = getProject(state.selectedProjectId);
    if (!project) return result;

    const pointer = project.deliverable_pointers[deliverableId];
    if (pointer) {
      updateDeliverablePointer(state.selectedProjectId, deliverableId, {
        ...pointer,
        validated: result.ok,
      });

      setState((s) => {
        const newArtifacts = new Map(s.artifacts);
        const current = newArtifacts.get(deliverableId);
        if (current) {
          newArtifacts.set(deliverableId, { ...current, validated: result.ok });
        }
        return { ...s, artifacts: newArtifacts };
      });
    }

    return result;
  }, [state.artifacts, state.selectedProjectId]);

  const revalidateAll = useCallback(async () => {
    const deliverableIds: DeliverableId[] = ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];

    for (const id of deliverableIds) {
      if (state.artifacts.has(id)) {
        await revalidateDeliverable(id);
      }
    }
  }, [state.artifacts, revalidateDeliverable]);

  const regenerateDeliverable = useCallback(async (
    deliverableId: DeliverableId,
    cascade: boolean,
    preserveEdits: boolean = false
  ) => {
    if (!state.selectedProjectId) return;

    const project = getProject(state.selectedProjectId);
    if (!project || !project.run_id) return;

    let editedFieldsBackup: { fields: string[]; values: Map<string, unknown> } | null = null;

    if (preserveEdits && deliverableId === 'WR1') {
      const wr1Artifact = state.artifacts.get('WR1');
      if (wr1Artifact) {
        const wr1Content = wr1Artifact.content as Record<string, unknown>;
        const editedFields = (wr1Content.edited_fields as string[]) || [];

        if (editedFields.length > 0) {
          const values = new Map<string, unknown>();
          for (const fieldPath of editedFields) {
            const pathParts = fieldPath.split('.');
            let value: unknown = wr1Content;
            for (const part of pathParts) {
              if (value && typeof value === 'object') {
                value = (value as Record<string, unknown>)[part];
              } else {
                value = undefined;
                break;
              }
            }
            if (value !== undefined) {
              values.set(fieldPath, value);
            }
          }
          editedFieldsBackup = { fields: editedFields, values };
        }
      }
    }

    const orchestrator = new PipelineOrchestrator((progress) => {
      setState((s) => ({
        ...s,
        pipelineProgress: [...s.pipelineProgress.filter(p => p.deliverableId !== progress.deliverableId), progress],
      }));
    });

    setState((s) => ({
      ...s,
      isPipelineRunning: true,
      pipelineProgress: [],
      error: null,
      pipelineError: null,
      orchestrator,
    }));

    try {
      await orchestrator.runSelectiveRegeneration(
        state.selectedProjectId,
        project.run_id,
        deliverableId,
        cascade
      );

      if (editedFieldsBackup && editedFieldsBackup.fields.length > 0) {
        const freshArtifact = await readArtifact(
          `${state.selectedProjectId}:${project.run_id}:WR1:v1`
        );

        if (freshArtifact) {
          const mergedContent = JSON.parse(JSON.stringify(freshArtifact.content)) as Record<string, unknown>;

          for (const [fieldPath, value] of editedFieldsBackup.values) {
            const pathParts = fieldPath.split('.');
            let target: Record<string, unknown> = mergedContent;

            for (let i = 0; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              if (target[part] && typeof target[part] === 'object') {
                target = target[part] as Record<string, unknown>;
              }
            }

            target[pathParts[pathParts.length - 1]] = value;
          }

          mergedContent.edited_fields = editedFieldsBackup.fields;

          await atomicArtifactWrite(
            state.selectedProjectId,
            project.run_id,
            'WR1',
            mergedContent,
            false
          );
        }
      }

      await loadProjects();
      await loadProjectArtifacts(state.selectedProjectId);
    } catch (error) {
      console.error('Selective regeneration failed:', error);

      let pipelineError: PipelineError;

      if (error instanceof PipelineValidationError) {
        pipelineError = {
          message: error.message,
          deliverableId: error.deliverableId,
          details: error.validationErrors,
          errorType: error.errorType,
        };
      } else {
        pipelineError = {
          message: error instanceof Error ? error.message : 'Regeneration failed',
          errorType: 'unknown',
        };
      }

      setState((s) => ({
        ...s,
        error: pipelineError.message,
        pipelineError,
      }));

      await loadProjects();
      await loadProjectArtifacts(state.selectedProjectId);
    } finally {
      setState((s) => ({ ...s, isPipelineRunning: false, orchestrator: null }));
    }
  }, [state.selectedProjectId, state.artifacts, loadProjects, loadProjectArtifacts]);

  const cancelPipeline = useCallback(() => {
    if (state.orchestrator) {
      state.orchestrator.cancel();
    }
  }, [state.orchestrator]);

  const exportDocx = useCallback(async (deliverableId: DeliverableId) => {
    const artifact = state.artifacts.get(deliverableId);
    if (!artifact || !artifact.validated) return;

    const project = state.selectedProjectId ? getProject(state.selectedProjectId) : null;
    const projectTitle = project?.title || 'Webinar';

    await generateDocx(deliverableId, artifact.content, projectTitle);
  }, [state.artifacts, state.selectedProjectId]);

  const exportZip = useCallback(async () => {
    if (!state.selectedProjectId) return;

    const project = getProject(state.selectedProjectId);
    if (!project || !project.run_id) return;

    const eligibility = await computeExportEligibility(state.selectedProjectId, project.run_id);

    if (!eligibility.canExport) {
      setState((s) => ({
        ...s,
        error: `Export blocked: ${eligibility.blocking_reasons.join(', ')}`,
      }));
      return;
    }

    const projectTitle = project.title || 'Webinar';
    const freshArtifacts = await loadAllArtifacts(state.selectedProjectId, project.run_id);

    const exportArtifacts = new Map<DeliverableId, { content: unknown; validated: boolean }>();
    for (const [id, artifact] of freshArtifacts) {
      exportArtifacts.set(id, { content: artifact.content, validated: artifact.validated });
    }

    await generateExportZip(projectTitle, exportArtifacts);
  }, [state.selectedProjectId]);

  const removeProject = useCallback(async (projectId: string) => {
    deleteProject(projectId);
    if (state.selectedProjectId === projectId) {
      setState((s) => ({ ...s, selectedProjectId: null, artifacts: new Map() }));
    }
    await loadProjects();
  }, [state.selectedProjectId, loadProjects]);

  const updateSettings = useCallback((updates: Partial<{
    cta_mode: CTA;
    audience_temperature: AudienceTemperature;
    webinar_length_minutes: number;
    client_name?: string;
    speaker_name?: string;
    company_name?: string;
    contact_email?: string;
    operator?: {
      sender_name?: string;
      sender_email?: string;
      reply_to_email?: string;
      primary_cta_link?: string;
      registration_link?: string;
    };
  }>) => {
    if (!state.selectedProjectId) return;

    updateProjectSettings(state.selectedProjectId, updates);
    loadProjects();
  }, [state.selectedProjectId, loadProjects]);

  const regenerateExecutiveSummary = useCallback(async () => {
    if (!state.selectedProjectId) return;

    const project = getProject(state.selectedProjectId);
    if (!project || !project.run_id) return;

    const orchestrator = new PipelineOrchestrator((progress) => {
      setState((s) => ({
        ...s,
        pipelineProgress: [...s.pipelineProgress.filter(p => p.deliverableId !== progress.deliverableId), progress],
      }));
    });

    setState((s) => ({
      ...s,
      isPipelineRunning: true,
      pipelineProgress: [],
      error: null,
      pipelineError: null,
      orchestrator,
    }));

    try {
      await orchestrator.regenerateExecutiveSummary(state.selectedProjectId, project.run_id);
      await loadProjectArtifacts(state.selectedProjectId);
    } catch (error) {
      console.error('Executive summary regeneration failed:', error);

      const pipelineError: PipelineError = {
        message: error instanceof Error ? error.message : 'Executive summary regeneration failed',
        deliverableId: 'WR1',
        errorType: 'unknown',
      };

      setState((s) => ({
        ...s,
        error: pipelineError.message,
        pipelineError,
      }));
    } finally {
      setState((s) => ({ ...s, isPipelineRunning: false, orchestrator: null }));
    }
  }, [state.selectedProjectId, loadProjectArtifacts]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const selectedProject = state.selectedProjectId
    ? getProject(state.selectedProjectId) || null
    : null;

  return {
    ...state,
    selectedProject,
    loadProjects,
    selectProject,
    createNewProject,
    runPipeline,
    editDeliverable,
    revalidateDeliverable,
    revalidateAll,
    regenerateDeliverable,
    regenerateExecutiveSummary,
    exportDocx,
    exportZip,
    removeProject,
    clearError,
    cancelPipeline,
    updateSettings,
  };
}
