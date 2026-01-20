import { z } from 'zod';
import {
  DeliverableId,
  PreflightStoredSchema,
  WR1Schema,
  WR2Schema,
  WR3Schema,
  WR4Schema,
  WR5Schema,
  WR6Schema,
  WR7Schema,
  WR8Schema,
  WR9Schema,
  ValidationResult,
} from '../contracts';
import { validateCrosslinks } from './crosslinkValidator';

const SCHEMA_MAP: Record<DeliverableId, z.ZodSchema> = {
  PREFLIGHT: PreflightStoredSchema,
  WR1: WR1Schema,
  WR2: WR2Schema,
  WR3: WR3Schema,
  WR4: WR4Schema,
  WR5: WR5Schema,
  WR6: WR6Schema,
  WR7: WR7Schema,
  WR8: WR8Schema,
  WR9: WR9Schema,
};

export function validateSchema(
  deliverableId: DeliverableId,
  content: unknown
): ValidationResult {
  const schema = SCHEMA_MAP[deliverableId];

  if (!schema) {
    return {
      ok: false,
      errors: [`schema_not_found:${deliverableId}`],
    };
  }

  try {
    schema.parse(content);
    return { ok: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return `schema:${deliverableId}.${path} ${err.message}`;
      });
      return { ok: false, errors };
    }
    return {
      ok: false,
      errors: [`schema_validation_error:${String(error)}`],
    };
  }
}

export async function validateDeliverable(
  deliverableId: DeliverableId,
  content: unknown,
  dependencies: Map<DeliverableId, unknown>
): Promise<ValidationResult> {
  const schemaResult = validateSchema(deliverableId, content);

  if (!schemaResult.ok) {
    return schemaResult;
  }

  const crosslinkResult = validateCrosslinks(
    deliverableId,
    content,
    dependencies
  );

  return {
    ok: schemaResult.ok && crosslinkResult.ok,
    errors: [...schemaResult.errors, ...crosslinkResult.errors],
  };
}
