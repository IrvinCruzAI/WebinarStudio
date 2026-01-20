import {
  DeliverableId,
  TranscriptData,
  ArtifactData,
  NormalizationLog,
} from '../contracts';
import {
  writeTranscript as dbWriteTranscript,
  readTranscript,
  writeArtifact,
  readArtifact,
  listArtifacts,
} from './indexedDbWrapper';
import { loadMetadata, saveMetadata, getProject, updateProject } from './metadataModel';
import { buildArtifactId } from '../contracts/ids';

export { readArtifact, readTranscript };

export async function writeTranscript(
  projectId: string,
  data: TranscriptData
): Promise<void> {
  await dbWriteTranscript(projectId, data);
}

export async function atomicTranscriptWrite(
  projectId: string,
  data: TranscriptData
): Promise<void> {
  await writeTranscript(projectId, data);

  const verification = await readTranscript(projectId);
  if (!verification) {
    throw new Error('Atomic transcript write verification failed');
  }
}

export async function atomicArtifactWrite(
  projectId: string,
  runId: string,
  deliverableId: DeliverableId,
  content: unknown,
  validated: boolean,
  normalizationLog?: NormalizationLog
): Promise<void> {
  const artifactId = buildArtifactId(projectId, runId, deliverableId);

  const existingArtifact = await readArtifact(artifactId);
  const generatedAt = existingArtifact?.generated_at || Date.now();

  await writeArtifact(artifactId, {
    content,
    validated,
    generated_at: generatedAt,
    edited_at: existingArtifact ? Date.now() : undefined,
    normalization_log: normalizationLog || existingArtifact?.normalization_log,
  });

  const verification = await readArtifact(artifactId);
  if (!verification) {
    throw new Error('Atomic artifact write verification failed');
  }

  const project = getProject(projectId);
  if (project && project.run_id === runId) {
    project.deliverable_pointers[deliverableId] = {
      artifact_id: artifactId,
      validated: verification.validated,
      generated_at: verification.generated_at,
      edited_at: verification.edited_at,
    };
    project.updated_at = Date.now();

    const allProjects = loadMetadata();
    const index = allProjects.findIndex(p => p.project_id === projectId);
    if (index !== -1) {
      allProjects[index] = project;
      saveMetadata(allProjects);
    }
  }
}

export async function detectPointerRot(
  projectId: string
): Promise<DeliverableId[]> {
  const project = getProject(projectId);
  if (!project) return [];

  const missingArtifacts: DeliverableId[] = [];

  for (const [deliverableId, pointer] of Object.entries(project.deliverable_pointers)) {
    const artifact = await readArtifact(pointer.artifact_id);
    if (!artifact) {
      missingArtifacts.push(deliverableId as DeliverableId);
      pointer.validated = false;
    }
  }

  if (missingArtifacts.length > 0) {
    updateProject(projectId, { deliverable_pointers: project.deliverable_pointers });
  }

  return missingArtifacts;
}

export async function loadAllArtifacts(
  projectId: string,
  runId: string
): Promise<Map<DeliverableId, ArtifactData & { artifact_id: string }>> {
  const artifactIds = await listArtifacts(projectId, runId);
  const artifacts = new Map<DeliverableId, ArtifactData & { artifact_id: string }>();

  for (const artifactId of artifactIds) {
    const parts = artifactId.split(':');
    if (parts.length === 4) {
      const deliverableId = parts[2] as DeliverableId;
      const artifact = await readArtifact(artifactId);
      if (artifact) {
        artifacts.set(deliverableId, { ...artifact, artifact_id: artifactId });
      }
    }
  }

  return artifacts;
}

export async function editArtifact(
  projectId: string,
  runId: string,
  deliverableId: DeliverableId,
  newContent: unknown
): Promise<void> {
  const artifactId = buildArtifactId(projectId, runId, deliverableId);
  const existing = await readArtifact(artifactId);

  if (!existing) {
    throw new Error(`Artifact ${artifactId} not found`);
  }

  await writeArtifact(artifactId, {
    content: newContent,
    validated: false,
    generated_at: existing.generated_at,
    edited_at: Date.now(),
  });

  const verification = await readArtifact(artifactId);
  if (!verification) {
    throw new Error('Edit verification failed');
  }

  const project = getProject(projectId);
  if (project && project.run_id === runId) {
    if (project.deliverable_pointers[deliverableId]) {
      project.deliverable_pointers[deliverableId]!.validated = false;
      project.deliverable_pointers[deliverableId]!.edited_at = verification.edited_at;
      updateProject(projectId, { deliverable_pointers: project.deliverable_pointers });
    }
  }
}
