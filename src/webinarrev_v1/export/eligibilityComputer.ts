import { DeliverableId, ExportEligibility, PreflightStored } from '../contracts';
import { loadAllArtifacts } from '../store/storageService';
import { validateDeliverable } from '../pipeline/validator';
import { scanPlaceholdersForProject } from '../pipeline/placeholderScanner';
import { computeReadinessScore } from '../pipeline/readinessScorer';
import { readArtifact } from '../store/indexedDbWrapper';

export async function computeExportEligibility(
  projectId: string,
  runId: string
): Promise<ExportEligibility> {
  const artifacts = await loadAllArtifacts(projectId, runId);
  const validationResults = new Map<string, { ok: boolean; errors: string[] }>();

  const deliverableIds: DeliverableId[] = ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];

  for (const deliverableId of deliverableIds) {
    const artifact = artifacts.get(deliverableId);
    if (artifact) {
      const dependencies = new Map<DeliverableId, unknown>();
      for (const [id, art] of artifacts) {
        dependencies.set(id, art.content);
      }

      const result = await validateDeliverable(deliverableId, artifact.content, dependencies);
      validationResults.set(deliverableId, result);
    } else {
      validationResults.set(deliverableId, {
        ok: false,
        errors: [`missing_deliverable:${deliverableId}`],
      });
    }
  }

  const placeholderScan = await scanPlaceholdersForProject(
    projectId,
    runId,
    readArtifact
  );

  let missingContextCount = 0;
  const preflightArtifact = artifacts.get('PREFLIGHT');
  if (preflightArtifact?.content) {
    const preflight = preflightArtifact.content as PreflightStored;
    missingContextCount = preflight.missing_context?.length ?? 0;
  }

  const readinessResult = computeReadinessScore({
    validationResults,
    placeholderScan,
    missingContextCount,
  });

  return {
    canExport: readinessResult.pass,
    readiness_score: readinessResult.score,
    pass: readinessResult.pass,
    blocking_reasons: readinessResult.blockingReasons,
    validation_results: Object.fromEntries(validationResults),
    placeholder_scan: {
      total_count: placeholderScan.total_count,
      critical_count: placeholderScan.critical_count,
      locations: placeholderScan.locations,
    },
  };
}
