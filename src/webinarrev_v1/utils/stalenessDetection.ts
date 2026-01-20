import type { DeliverableId } from '../contracts';

export interface StalenessInfo {
  isStale: boolean;
  reasons: string[];
  upstreamChanges: Array<{
    deliverableId: DeliverableId;
    timestamp: number;
  }>;
}

const DEPENDENCY_MAP: Record<DeliverableId, DeliverableId[]> = {
  PREFLIGHT: [],
  WR1: ['PREFLIGHT'],
  WR2: ['WR1'],
  WR3: ['WR1', 'WR2'],
  WR4: ['WR1', 'WR2'],
  WR5: ['WR1', 'WR2'],
  WR6: ['WR2'],
  WR7: ['WR2'],
  WR8: ['WR2', 'WR3'],
  WR9: ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'],
};

export function checkStaleness(
  deliverableId: DeliverableId,
  artifacts: Map<DeliverableId, { generated_at: number; edited_at?: number }>
): StalenessInfo {
  const result: StalenessInfo = {
    isStale: false,
    reasons: [],
    upstreamChanges: [],
  };

  const currentArtifact = artifacts.get(deliverableId);
  if (!currentArtifact) {
    return result;
  }

  const currentTimestamp = currentArtifact.generated_at;
  const dependencies = DEPENDENCY_MAP[deliverableId] || [];

  for (const depId of dependencies) {
    const depArtifact = artifacts.get(depId);
    if (!depArtifact) continue;

    const depTimestamp = depArtifact.edited_at || depArtifact.generated_at;

    if (depTimestamp > currentTimestamp) {
      result.isStale = true;
      result.reasons.push(
        `${depId} was modified after ${deliverableId} was generated`
      );
      result.upstreamChanges.push({
        deliverableId: depId,
        timestamp: depTimestamp,
      });
    }
  }

  return result;
}

export function formatStalenessWarning(info: StalenessInfo): string {
  if (!info.isStale) return '';

  const upstreamList = info.upstreamChanges
    .map((c) => c.deliverableId)
    .join(', ');

  return `Warning: This deliverable may be outdated. The following upstream dependencies have been modified: ${upstreamList}`;
}
