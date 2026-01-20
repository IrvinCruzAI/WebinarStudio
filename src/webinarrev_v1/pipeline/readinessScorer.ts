import { ValidationResult, PlaceholderScanResult, DeliverableId } from '../contracts';

const DELIVERABLE_IDS: DeliverableId[] = ['WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'WR6', 'WR7', 'WR8'];

export interface ReadinessInput {
  validationResults: Map<string, ValidationResult>;
  placeholderScan: PlaceholderScanResult;
  missingContextCount: number;
}

export interface ReadinessResult {
  score: number;
  pass: boolean;
  blockingReasons: string[];
}

export function computeReadinessScore(input: ReadinessInput): ReadinessResult {
  const { validationResults, placeholderScan, missingContextCount } = input;

  let score = 100;

  const missingContextPenalty = Math.min(15 * missingContextCount, 60);
  score -= missingContextPenalty;

  const criticalPlaceholderPenalty = Math.min(10 * placeholderScan.critical_count, 40);
  score -= criticalPlaceholderPenalty;

  let anyInvalid = false;
  for (const deliverableId of DELIVERABLE_IDS) {
    const result = validationResults.get(deliverableId);
    if (!result || !result.ok) {
      anyInvalid = true;
      break;
    }
  }

  if (anyInvalid) {
    score -= 10;
  }

  score = Math.max(score, 0);

  const allValidated = !anyInvalid;
  const pass = score >= 70 && placeholderScan.critical_count === 0 && allValidated;

  const blockingReasons = computeBlockingReasons(validationResults, placeholderScan, score, pass);

  return { score, pass, blockingReasons };
}

function computeBlockingReasons(
  validationResults: Map<string, ValidationResult>,
  placeholderScan: PlaceholderScanResult,
  score: number,
  pass: boolean
): string[] {
  const reasons: string[] = [];

  if (placeholderScan.critical_count > 0) {
    reasons.push(`critical_placeholders_present (${placeholderScan.critical_count})`);
  }

  for (const deliverableId of DELIVERABLE_IDS) {
    const result = validationResults.get(deliverableId);
    if (!result) {
      reasons.push(`${deliverableId}_missing`);
    } else if (!result.ok) {
      const hasCrosslinkError = result.errors.some(e => e.startsWith('crosslink_'));
      const hasSchemaError = result.errors.some(e => e.startsWith('schema:'));

      if (hasSchemaError) {
        reasons.push(`${deliverableId}_schema_invalid`);
      }
      if (hasCrosslinkError) {
        reasons.push(`${deliverableId}_crosslink_invalid`);
      }
      if (!hasSchemaError && !hasCrosslinkError && result.errors.length > 0) {
        reasons.push(`${deliverableId}_validation_failed`);
      }
    }
  }

  if (score < 70) {
    reasons.push(`readiness_score_below_threshold (${score})`);
  }

  return reasons;
}

export function computeReadinessScoreLegacy(
  validationResults: Map<string, ValidationResult>,
  placeholderScan: PlaceholderScanResult
): number {
  const result = computeReadinessScore({
    validationResults,
    placeholderScan,
    missingContextCount: 0,
  });
  return result.score;
}

export function computeBlockingReasonsLegacy(
  validationResults: Map<string, ValidationResult>,
  placeholderScan: PlaceholderScanResult,
  readinessScore: number
): string[] {
  const result = computeReadinessScore({
    validationResults,
    placeholderScan,
    missingContextCount: 0,
  });
  return result.blockingReasons;
}
