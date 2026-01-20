import { DeliverableId } from './enums';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateProjectId(): string {
  return `wrproj_${generateUUID()}`;
}

export function generateRunId(): string {
  return `run_${generateUUID()}`;
}

export function buildArtifactId(
  projectId: string,
  runId: string,
  deliverableId: DeliverableId
): string {
  return `${projectId}:${runId}:${deliverableId}:v1`;
}

export function parseArtifactId(artifactId: string): {
  projectId: string;
  runId: string;
  deliverableId: string;
  version: string;
} | null {
  const parts = artifactId.split(':');
  if (parts.length !== 4) return null;

  if (!parts[0] || !parts[1] || !parts[2] || !parts[3]) {
    console.warn('[parseArtifactId] Artifact ID has empty parts:', { artifactId, parts });
    return null;
  }

  return {
    projectId: parts[0],
    runId: parts[1],
    deliverableId: parts[2],
    version: parts[3],
  };
}

export function safeGetRunIdFromArtifactId(artifactId: string): string | null {
  const parsed = parseArtifactId(artifactId);
  if (!parsed) {
    console.error('[safeGetRunIdFromArtifactId] Failed to parse artifact ID:', artifactId);
    return null;
  }
  return parsed.runId;
}

export function validateEmailId(id: string): boolean {
  return /^E(0[1-9]|10)$/.test(id);
}

export function validateSocialId(id: string): boolean {
  return /^S(0[1-9]|1[0-8])$/.test(id);
}

export function validateChecklistId(id: string): boolean {
  return /^CL_(pre|live|post)_\d{3}$/.test(id);
}

export function extractChecklistCategory(id: string): 'pre' | 'live' | 'post' | null {
  const match = id.match(/^CL_(pre|live|post)_\d{3}$/);
  return match ? (match[1] as 'pre' | 'live' | 'post') : null;
}
