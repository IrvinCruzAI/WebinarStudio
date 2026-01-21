import { z } from 'zod';
import { CancellableAIClient } from '../ai/client';
import { canonicalizeDeliverable, type NormalizationLog } from './canonicalizer';

export interface RepairContext {
  deliverableId: string;
  constraintSummary: string;
  onRepairAttempt?: (attempt: number, maxAttempts: number) => void;
  onNormalization?: (log: NormalizationLog) => void;
}

export interface RepairResult<T> {
  data: T;
  repairAttempts: number;
  errors: string[];
  normalizationLog?: NormalizationLog;
}

const COMPLEX_DELIVERABLES = ['WR2', 'WR4', 'WR5', 'WR6', 'WR7'];

function getSmartRepairHints(error: z.ZodError, deliverableId: string): string[] {
  const hints: string[] = [];

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const code = issue.code;
    const message = issue.message;

    if (deliverableId === 'WR2') {
      if (path.includes('block_id') || message.includes('enum')) {
        hints.push('Block IDs MUST be exactly B01, B02, B03... B21 with leading zeros. Convert any B1 to B01, B2 to B02, etc.');
      }
      if (path === 'blocks' && message.includes('21')) {
        hints.push('You MUST have EXACTLY 21 blocks. Count your blocks array and add/remove to get exactly 21.');
      }
      if (path.includes('phase')) {
        hints.push('Phase mapping: B01-B07="beginning", B08-B14="middle", B15-B21="end". Check each block has correct phase for its ID.');
      }
    }

    if (deliverableId === 'WR4') {
      if (path.includes('email_id')) {
        hints.push('Email IDs MUST be E01, E02, E03... E10 with TWO digits. Convert E1 to E01, E2 to E02, etc.');
      }
      if (path === 'emails' && (message.includes('8') || message.includes('10'))) {
        hints.push('You must have 8-10 emails. Adjust the array length.');
      }
    }

    if (deliverableId === 'WR5') {
      if (path.includes('social_id')) {
        hints.push('Social IDs MUST use two digits: S01-S08 for LinkedIn, S09-S14 for X/Twitter, S15-S18 for last_chance. Convert S1 to S01, etc.');
      }
    }

    if (deliverableId === 'WR7') {
      if (path.includes('checklist_id')) {
        hints.push('Checklist IDs MUST use 3 digits: CL_pre_001, CL_live_001, CL_post_001. Convert CL_pre_1 to CL_pre_001, etc.');
      }
    }

    if (deliverableId === 'WR8') {
      if (path.includes('gamma_prompt') && message.includes('100')) {
        hints.push('gamma_prompt MUST be at least 100 characters. Expand the prompt with more details about style, colors, and slide content.');
      }
    }

    if (code === 'unrecognized_keys') {
      hints.push(`Remove extra fields not in the schema. Found unexpected keys at ${path || 'root'}.`);
    }

    if (code === 'invalid_type') {
      hints.push(`Field "${path}" has wrong type. Expected ${message.split('expected ')[1] || 'correct type'}.`);
    }
  }

  return [...new Set(hints)];
}

function createRepairPrompt(
  error: unknown,
  output: unknown,
  context: RepairContext,
  attempt: number
): { system: string; user: string } {
  let errorMessage: string;
  let smartHints: string[] = [];

  if (error instanceof z.ZodError) {
    const issues = error.issues || [];
    errorMessage = JSON.stringify(
      issues.map(err => ({
        path: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
        message: err.message || 'Unknown error',
        code: err.code || 'unknown',
      })),
      null,
      2
    );
    smartHints = getSmartRepairHints(error, context.deliverableId);
  } else {
    errorMessage = String(error);
  }

  const hintsSection = smartHints.length > 0
    ? `\n\nSPECIFIC FIX INSTRUCTIONS:\n${smartHints.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
    : '';

  const system = `You are a JSON repair specialist. Your task is to fix validation errors in JSON output.
This is repair attempt ${attempt + 1}. Previous attempts failed validation.

CONSTRAINT SUMMARY FOR ${context.deliverableId}:
${context.constraintSummary}

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown fences, no explanation, no text before or after
2. Do NOT add any fields not specified in the schema
3. All IDs must use leading zeros (B01 not B1, E01 not E1, S01 not S1, CL_pre_001 not CL_pre_1)
4. Fix ALL errors listed, not just the first one
${hintsSection}`;

  const user = `The following JSON failed validation with these errors:

ERRORS:
${errorMessage}

INVALID OUTPUT (truncated if too long):
${JSON.stringify(output, null, 2).slice(0, 15000)}

Return a COMPLETE, CORRECTED JSON object that:
1. Fixes all validation errors listed above
2. Matches the required schema exactly
3. Contains no extra fields
4. Uses correct ID formats with leading zeros`;

  return { system, user };
}

export async function attemptRepair<T>(
  rawOutput: unknown,
  schema: z.ZodSchema<T>,
  context: RepairContext,
  aiClient: CancellableAIClient,
  maxAttempts?: number
): Promise<T> {
  const isComplex = COMPLEX_DELIVERABLES.includes(context.deliverableId);
  const effectiveMaxAttempts = maxAttempts ?? (isComplex ? 3 : 2);
  const errors: string[] = [];
  let latestNormalizationLog: NormalizationLog | undefined;

  for (let attempt = 0; attempt < effectiveMaxAttempts; attempt++) {
    try {
      const { canonicalized, log } = canonicalizeDeliverable(context.deliverableId, rawOutput);
      latestNormalizationLog = log;

      if (log.totalChanges > 0 && context.onNormalization) {
        context.onNormalization(log);
      }

      const result = schema.parse(canonicalized);
      if (attempt > 0) {
        console.log(`Repair succeeded for ${context.deliverableId} on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      const errorStr = error instanceof z.ZodError
        ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
        : String(error);
      errors.push(`Attempt ${attempt + 1}: ${errorStr}`);

      if (attempt === effectiveMaxAttempts - 1) {
        console.error(`Repair failed after ${effectiveMaxAttempts} attempts for ${context.deliverableId}`);
        console.error('Final errors:', errors);

        // Translate errors to plain English for operator
        const translatedErrors = error instanceof z.ZodError
          ? error.issues.map(issue => {
              const path = issue.path.join('.');

              // Translate common patterns to plain English
              if (path.includes('block_id') || issue.message.includes('enum')) {
                return 'Block IDs must be exactly B01-B21 with leading zeros';
              }
              if (path.includes('email_id')) {
                return 'Email IDs must be E01-E10 with leading zeros';
              }
              if (path.includes('social_id')) {
                return 'Social IDs must use two digits (S01-S18)';
              }
              if (path.includes('checklist_id')) {
                return 'Checklist IDs must use 3 digits (CL_pre_001, CL_live_001, CL_post_001)';
              }
              if (path.includes('gamma_prompt') && issue.message.includes('100')) {
                return 'Deck prompt must be at least 100 characters';
              }
              if (issue.code === 'invalid_type') {
                return `Field "${path}" has wrong type (expected ${issue.expected || 'correct type'})`;
              }
              if (issue.code === 'too_small' && path === 'blocks') {
                return 'Framework must have exactly 21 blocks';
              }
              if (issue.code === 'too_small' && path === 'emails') {
                return 'Email campaign must have 8-10 emails';
              }

              // Fallback to simplified version
              return `${path}: ${issue.message}`;
            })
          : [error instanceof Error ? error.message : String(error)];

        // Create operator-friendly error
        const operatorError = new Error(
          `Failed to generate valid ${context.deliverableId} after ${effectiveMaxAttempts} repair attempts. ` +
          `Issues: ${translatedErrors.slice(0, 3).join('; ')}${translatedErrors.length > 3 ? ' (and more)' : ''}`
        );

        // Attach original error for debugging
        (operatorError as any).originalError = error;
        (operatorError as any).translatedErrors = translatedErrors;

        throw operatorError;
      }

      console.warn(
        `Validation failed for ${context.deliverableId}, attempting repair (attempt ${attempt + 1}/${effectiveMaxAttempts})`
      );

      if (context.onRepairAttempt) {
        context.onRepairAttempt(attempt + 1, effectiveMaxAttempts);
      }

      const repairPrompts = createRepairPrompt(error, rawOutput, context, attempt);
      rawOutput = await aiClient.call(repairPrompts.system, repairPrompts.user);
    }
  }

  throw new Error(`Repair failed after ${effectiveMaxAttempts} attempts`);
}

export function formatValidationErrors(error: unknown): string[] {
  if (error instanceof z.ZodError) {
    return error.issues.map(issue => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return `${path}: ${issue.message}`;
    });
  }
  return [String(error)];
}

export function classifyValidationError(error: unknown): 'schema' | 'crosslink' | 'unknown' {
  if (error instanceof z.ZodError) {
    return 'schema';
  }
  const errorStr = String(error);
  if (errorStr.includes('crosslink')) {
    return 'crosslink';
  }
  return 'unknown';
}
