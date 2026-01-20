import type { DeliverableId } from '../contracts';

const INTERNAL_FIELDS = new Set([
  'qa',
  'meta',
  'validated',
  'generated_at',
  'edited_at',
  'artifact_id',
  'assumptions',
  'placeholders',
  'claims_requiring_proof',
  'readiness_score',
  'pass',
  'blocking_reasons',
  'validation_results',
  'placeholder_scan',
  'recommended_next_actions',
  'status',
  'readiness',
  'missing_context',
  'recommended_questions',
  'risk_flags',
]);

const WR2_COACH_ONLY_FIELDS = new Set([
  'speaker_notes_md',
]);

const WR6_COACH_ONLY_FIELDS = new Set([
  'coach_cue',
  'fallback_if_cold',
  'time_check',
]);

function stripInternalFields(data: unknown, excludeFields: Set<string>): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => stripInternalFields(item, excludeFields));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (INTERNAL_FIELDS.has(key) || excludeFields.has(key)) {
        continue;
      }
      sanitized[key] = stripInternalFields(value, excludeFields);
    }

    return sanitized;
  }

  return data;
}

function getDeliverableExclusions(deliverableId: DeliverableId): Set<string> {
  switch (deliverableId) {
    case 'WR2':
      return WR2_COACH_ONLY_FIELDS;
    case 'WR6':
      return WR6_COACH_ONLY_FIELDS;
    default:
      return new Set<string>();
  }
}

export function sanitizeForClient(deliverableId: DeliverableId, content: unknown): unknown {
  if (deliverableId === 'WR9' || deliverableId === 'PREFLIGHT') {
    return null;
  }

  const additionalExclusions = getDeliverableExclusions(deliverableId);
  return stripInternalFields(content, additionalExclusions);
}

export function sanitizeForOperator(content: unknown): unknown {
  return stripInternalFields(content, new Set());
}

export function validateSanitizedOutput(data: unknown): { valid: boolean; foundFields: string[] } {
  const foundFields: string[] = [];

  function checkRecursive(obj: unknown, path: string = ''): void {
    if (obj === null || obj === undefined) return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => checkRecursive(item, `${path}[${index}]`));
      return;
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (INTERNAL_FIELDS.has(key)) {
          foundFields.push(currentPath);
        }

        if (WR2_COACH_ONLY_FIELDS.has(key) || WR6_COACH_ONLY_FIELDS.has(key)) {
          foundFields.push(`${currentPath} (coach-only)`);
        }

        checkRecursive(value, currentPath);
      }
    }
  }

  checkRecursive(data);

  return {
    valid: foundFields.length === 0,
    foundFields,
  };
}

const PLACEHOLDER_PATTERNS = [
  /_placeholder$/,
  /\[.*placeholder.*\]/i,
  /\{.*placeholder.*\}/i,
  /TBD/,
  /TODO/,
  /MISSING/,
];

export function scanForPlaceholders(data: unknown): string[] {
  const found: string[] = [];

  function checkRecursive(obj: unknown, path: string = ''): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'string') {
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(obj)) {
          found.push(`${path}: "${obj.slice(0, 50)}..."`);
          break;
        }
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => checkRecursive(item, `${path}[${index}]`));
      return;
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        checkRecursive(value, currentPath);
      }
    }
  }

  checkRecursive(data);
  return found;
}
