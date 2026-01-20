import { z } from 'zod';
import {
  DeliverableId,
  PreflightStored,
  RiskFlag,
  WR9,
  NormalizationLog,
} from '../contracts';
import { CancellableAIClient, createAIClient } from '../ai/client';
import { AIQueue } from '../ai/queue';
import { buildSystemPrompt, buildUserPrompt, getConstraintSummary, PromptContext } from '../ai/prompts';
import { attemptRepair, formatValidationErrors } from './repairLoop';
import { validateDeliverable } from './validator';
import { scanPlaceholdersForProject } from './placeholderScanner';
import { computeReadinessScore } from './readinessScorer';
import { atomicArtifactWrite } from '../store/storageService';
import { readTranscript } from '../store/indexedDbWrapper';
import { getProject, updateProjectStatus } from '../store/metadataModel';
import {
  WR1Schema,
  WR2Schema,
  WR3Schema,
  WR4Schema,
  WR5Schema,
  WR6Schema,
  WR7Schema,
  WR8Schema,
  PreflightAISchema,
} from '../contracts/schemas';

const PIPELINE_STAGES = [
  { id: 'PREFLIGHT', batch: 1, dependencies: [] },
  { id: 'WR1', batch: 2, dependencies: ['PREFLIGHT'] },
  { id: 'WR2', batch: 3, dependencies: ['WR1'] },
  { id: 'WR3', batch: 4, dependencies: ['WR1', 'WR2'] },
  { id: 'WR4', batch: 4, dependencies: ['WR1', 'WR2'] },
  { id: 'WR5', batch: 4, dependencies: ['WR1', 'WR2'] },
  { id: 'WR6', batch: 5, dependencies: ['WR2'] },
  { id: 'WR7', batch: 5, dependencies: ['WR2'] },
  { id: 'WR8', batch: 5, dependencies: ['WR2', 'WR3'] },
  { id: 'WR9', batch: 6, dependencies: ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'] },
] as const;

const SCHEMA_MAP = {
  PREFLIGHT: PreflightAISchema,
  WR1: WR1Schema,
  WR2: WR2Schema,
  WR3: WR3Schema,
  WR4: WR4Schema,
  WR5: WR5Schema,
  WR6: WR6Schema,
  WR7: WR7Schema,
  WR8: WR8Schema,
};

export class PreflightBlockedError extends Error {
  constructor(
    message: string,
    public missingContext: Array<{ field: string; why_it_matters: string; example_answer: string }>
  ) {
    super(message);
    this.name = 'PreflightBlockedError';
  }
}

export class PipelineValidationError extends Error {
  constructor(
    message: string,
    public deliverableId: DeliverableId,
    public validationErrors: string[],
    public errorType: 'schema' | 'crosslink' | 'api' | 'unknown'
  ) {
    super(message);
    this.name = 'PipelineValidationError';
  }
}

export interface PipelineProgress {
  stage: string;
  deliverableId: DeliverableId;
  status: 'pending' | 'generating' | 'repairing' | 'validating' | 'complete' | 'error';
  error?: string;
  errorDetails?: string[];
  repairAttempt?: number;
  maxRepairAttempts?: number;
}

export type ProgressCallback = (progress: PipelineProgress) => void;

export class PipelineOrchestrator {
  private aiClient: CancellableAIClient;
  private queue: AIQueue;
  private progressCallback?: ProgressCallback;
  private cancelled = false;

  constructor(progressCallback?: ProgressCallback) {
    this.aiClient = createAIClient();
    this.queue = new AIQueue();
    this.progressCallback = progressCallback;
  }

  private reportProgress(progress: PipelineProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  async runPipeline(projectId: string, runId: string): Promise<void> {
    this.cancelled = false;

    try {
      const project = getProject(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      updateProjectStatus(projectId, 'generating');

      const transcriptData = await readTranscript(projectId);
      if (!transcriptData) {
        throw new Error(`Transcript data not found for project ${projectId}. Please ensure you have provided a build transcript.`);
      }

      if (!transcriptData.build_transcript || transcriptData.build_transcript.trim().length < 50) {
        throw new Error('Build transcript is too short. Please provide at least 50 characters of content.');
      }

      const context: PromptContext = {
        buildTranscript: transcriptData.build_transcript,
        intakeTranscript: transcriptData.intake_transcript,
        operatorNotes: transcriptData.operator_notes,
        settings: project.settings,
      };

      const dependencies = new Map<DeliverableId, unknown>();
      const failedDeliverables = new Map<DeliverableId, string[]>();

      const batches = new Map<number, typeof PIPELINE_STAGES[number][]>();
      for (const stage of PIPELINE_STAGES) {
        if (!batches.has(stage.batch)) {
          batches.set(stage.batch, []);
        }
        batches.get(stage.batch)!.push(stage);
      }

      const sortedBatchNumbers = Array.from(batches.keys()).sort((a, b) => a - b);

      for (const batchNumber of sortedBatchNumbers) {
        if (this.cancelled) {
          throw new Error('Pipeline cancelled by user');
        }

        const batchStages = batches.get(batchNumber)!;

        if (batchStages.length === 1 && batchStages[0].id === 'WR9') {
          await this.generateWR9(projectId, runId, dependencies, failedDeliverables);
          continue;
        }

        const batchPromises = batchStages.map(async (stage) => {
          const deliverableId = stage.id as DeliverableId;

          try {
            this.reportProgress({
              stage: `Stage ${stage.batch}`,
              deliverableId,
              status: 'generating',
            });

            const { content, normalizationLog } = await this.generateDeliverable(
              deliverableId,
              context,
              dependencies,
              stage.batch
            );

            if (deliverableId === 'PREFLIGHT') {
              const preflightStored = this.addRiskFlags(content);
              dependencies.set(deliverableId, preflightStored);

              if (preflightStored.status === 'blocked') {
                await atomicArtifactWrite(projectId, runId, deliverableId, preflightStored, false, normalizationLog);
                throw new PreflightBlockedError(
                  'Preflight check blocked pipeline',
                  preflightStored.missing_context
                );
              }

              await atomicArtifactWrite(projectId, runId, deliverableId, preflightStored, true, normalizationLog);
              this.reportProgress({
                stage: `Stage ${stage.batch}`,
                deliverableId,
                status: 'complete',
              });
            } else {
              dependencies.set(deliverableId, content);

              this.reportProgress({
                stage: `Stage ${stage.batch}`,
                deliverableId,
                status: 'validating',
              });

              const validationResult = await validateDeliverable(
                deliverableId,
                content,
                dependencies
              );

              await atomicArtifactWrite(
                projectId,
                runId,
                deliverableId,
                content,
                validationResult.ok,
                normalizationLog
              );

              if (!validationResult.ok) {
                failedDeliverables.set(deliverableId, validationResult.errors);
                this.reportProgress({
                  stage: `Stage ${stage.batch}`,
                  deliverableId,
                  status: 'error',
                  error: `Validation failed: ${validationResult.errors[0]}`,
                  errorDetails: validationResult.errors,
                });
              } else {
                this.reportProgress({
                  stage: `Stage ${stage.batch}`,
                  deliverableId,
                  status: 'complete',
                });
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = error instanceof z.ZodError
              ? formatValidationErrors(error)
              : [errorMessage];

            failedDeliverables.set(deliverableId, errorDetails);

            this.reportProgress({
              stage: `Stage ${stage.batch}`,
              deliverableId,
              status: 'error',
              error: errorMessage,
              errorDetails,
            });

            if (error instanceof PreflightBlockedError) {
              throw error;
            }

            console.error(`Error generating ${deliverableId}:`, error);
          }
        });

        await Promise.all(batchPromises);
      }

      const finalStatus = failedDeliverables.size > 0 ? 'review' : 'ready';
      updateProjectStatus(projectId, finalStatus);
    } catch (error) {
      console.error('Pipeline error:', error);

      try {
        updateProjectStatus(projectId, 'failed');
      } catch {
      }

      throw error;
    }
  }

  private async generateDeliverable(
    deliverableId: DeliverableId,
    context: PromptContext,
    dependencies: Map<DeliverableId, unknown>,
    batchNumber: number
  ): Promise<{ content: unknown; normalizationLog?: NormalizationLog }> {
    const enrichedContext = {
      ...context,
      dependencies: Object.fromEntries(dependencies),
    };

    const systemPrompt = buildSystemPrompt(deliverableId);
    const userPrompt = buildUserPrompt(deliverableId, enrichedContext);

    let rawOutput: unknown;

    try {
      rawOutput = await this.queue.enqueue(() =>
        this.aiClient.call(systemPrompt, userPrompt)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        throw new PipelineValidationError(
          'API key is invalid or missing. Please check your VITE_OPENROUTER_API_KEY configuration.',
          deliverableId,
          ['Invalid or missing API key'],
          'api'
        );
      }

      if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        throw new PipelineValidationError(
          'API rate limit exceeded. Please wait a moment and try again.',
          deliverableId,
          ['Rate limit exceeded'],
          'api'
        );
      }

      throw new PipelineValidationError(
        `Failed to generate ${deliverableId}: ${errorMessage}`,
        deliverableId,
        [errorMessage],
        'api'
      );
    }

    const schema = SCHEMA_MAP[deliverableId as keyof typeof SCHEMA_MAP];
    if (!schema) {
      throw new Error(`No schema found for ${deliverableId}`);
    }

    let capturedNormalizationLog: NormalizationLog | undefined;

    try {
      const content = await attemptRepair(
        rawOutput,
        schema,
        {
          deliverableId,
          constraintSummary: getConstraintSummary(deliverableId),
          onRepairAttempt: (attempt, maxAttempts) => {
            this.reportProgress({
              stage: `Stage ${batchNumber}`,
              deliverableId,
              status: 'repairing',
              repairAttempt: attempt,
              maxRepairAttempts: maxAttempts,
            });
          },
          onNormalization: (log) => {
            capturedNormalizationLog = log;
          },
        },
        this.aiClient
      );
      return { content, normalizationLog: capturedNormalizationLog };
    } catch (error) {
      const errorDetails = error instanceof z.ZodError
        ? formatValidationErrors(error)
        : [error instanceof Error ? error.message : String(error)];

      throw new PipelineValidationError(
        `Schema validation failed for ${deliverableId} after repair attempts`,
        deliverableId,
        errorDetails,
        'schema'
      );
    }
  }

  private addRiskFlags(preflightAI: unknown): PreflightStored {
    const validated = PreflightAISchema.parse(preflightAI);
    const riskFlags: RiskFlag[] = [];

    const missingFields = new Set(validated.missing_context.map(m => m.field.toLowerCase()));
    const allText = JSON.stringify(validated).toLowerCase();

    if (missingFields.has('offer') || (allText.includes('offer') && allText.includes('missing'))) {
      riskFlags.push('offer_missing');
    }
    if (missingFields.has('target_audience') || missingFields.has('icp') || (allText.includes('audience') && allText.includes('unclear'))) {
      riskFlags.push('icp_missing');
    }
    if ((allText.includes('proof') && allText.includes('missing')) || allText.includes('testimonial') || allText.includes('case study')) {
      riskFlags.push('proof_missing');
    }
    if (missingFields.has('cta') || (allText.includes('cta') && allText.includes('unclear'))) {
      riskFlags.push('cta_unclear');
    }
    if ((allText.includes('mechanism') && allText.includes('unclear')) || (allText.includes('how') && allText.includes('unclear'))) {
      riskFlags.push('mechanism_unclear');
    }

    return {
      ...validated,
      risk_flags: riskFlags,
    };
  }

  private async generateWR9(
    projectId: string,
    runId: string,
    dependencies: Map<DeliverableId, unknown>,
    failedDeliverables: Map<DeliverableId, string[]>
  ): Promise<void> {
    this.reportProgress({
      stage: 'Stage 6',
      deliverableId: 'WR9',
      status: 'generating',
    });

    const validationResults = new Map<string, { ok: boolean; errors: string[] }>();

    for (const [deliverableId, content] of dependencies) {
      if (deliverableId === 'PREFLIGHT' || deliverableId === 'WR9') continue;

      if (failedDeliverables.has(deliverableId)) {
        validationResults.set(deliverableId, {
          ok: false,
          errors: failedDeliverables.get(deliverableId) || ['Generation failed'],
        });
      } else {
        const result = await validateDeliverable(deliverableId, content, dependencies);
        validationResults.set(deliverableId, result);
      }
    }

    const deliverableIds: DeliverableId[] = ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];
    for (const id of deliverableIds) {
      if (!validationResults.has(id)) {
        validationResults.set(id, {
          ok: false,
          errors: [`${id} was not generated`],
        });
      }
    }

    const placeholderScan = await scanPlaceholdersForProject(
      projectId,
      runId,
      async (artifactId) => {
        const parts = artifactId.split(':');
        const deliverableId = parts[2] as DeliverableId;
        const content = dependencies.get(deliverableId);
        return content ? { content } : null;
      }
    );

    let missingContextCount = 0;
    const preflight = dependencies.get('PREFLIGHT') as PreflightStored | undefined;
    if (preflight?.missing_context) {
      missingContextCount = preflight.missing_context.length;
    }

    const readinessResult = computeReadinessScore({
      validationResults,
      placeholderScan,
      missingContextCount,
    });

    const wr9: WR9 = {
      readiness_score: readinessResult.score,
      pass: readinessResult.pass,
      blocking_reasons: readinessResult.blockingReasons,
      validation_results: Object.fromEntries(validationResults),
      placeholder_scan: placeholderScan,
      recommended_next_actions: this.generateRecommendedActions(
        validationResults,
        placeholderScan,
        readinessResult.score,
        failedDeliverables
      ),
    };

    await atomicArtifactWrite(projectId, runId, 'WR9', wr9, true);

    this.reportProgress({
      stage: 'Stage 6',
      deliverableId: 'WR9',
      status: 'complete',
    });
  }

  private generateRecommendedActions(
    validationResults: Map<string, { ok: boolean; errors: string[] }>,
    placeholderScan: { total_count: number; critical_count: number },
    readinessScore: number,
    failedDeliverables: Map<DeliverableId, string[]>
  ): string[] {
    const actions: string[] = [];

    for (const [deliverableId, errors] of failedDeliverables) {
      actions.push(`Re-run generation for ${deliverableId} (failed with: ${errors[0]})`);
    }

    if (placeholderScan.critical_count > 0) {
      actions.push(`Fill ${placeholderScan.critical_count} critical placeholders before export`);
    }

    for (const [deliverableId, result] of validationResults) {
      if (!result.ok && !failedDeliverables.has(deliverableId as DeliverableId)) {
        const hasCrosslinkError = result.errors.some(e => e.includes('crosslink'));
        if (hasCrosslinkError) {
          actions.push(`Fix crosslink references in ${deliverableId}`);
        } else {
          actions.push(`Review and fix validation errors in ${deliverableId}`);
        }
      }
    }

    if (readinessScore < 70) {
      actions.push('Improve readiness score to at least 70 before client export');
    }

    if (actions.length === 0) {
      actions.push('All validations passed! Ready for client export.');
    }

    return actions;
  }

  cancel(): void {
    this.cancelled = true;
    this.queue.cancel();
    this.aiClient.abort();
  }
}
