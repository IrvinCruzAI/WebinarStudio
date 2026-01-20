export interface StructuredError {
  type: 'schema' | 'crosslink' | 'placeholder' | 'general';
  fieldPath?: string;
  expectedType?: string;
  receivedType?: string;
  message: string;
  hint?: string;
}

export function parseValidationError(error: string): StructuredError {
  if (error.includes('crosslink') || error.includes('block_id') || error.includes('email_id')) {
    const blockIdMatch = error.match(/block_id[:\s]+([A-Z0-9_]+)/i);
    const emailIdMatch = error.match(/email_id[:\s]+([A-Z0-9_]+)/i);

    return {
      type: 'crosslink',
      message: error,
      hint: blockIdMatch
        ? `Check that block ${blockIdMatch[1]} exists in WR2`
        : emailIdMatch
        ? `Check that email ${emailIdMatch[1]} exists in WR4`
        : 'Verify all referenced IDs exist in their source deliverables',
    };
  }

  if (error.includes('placeholder') || error.includes('[TK]') || error.includes('[FILL]')) {
    return {
      type: 'placeholder',
      message: error,
      hint: 'Fill in placeholder values before export',
    };
  }

  const fieldPathMatch = error.match(/(?:at\s+|in\s+|field\s+)(?:path\s+)?["`']?([a-zA-Z0-9_.\[\]]+)["`']?/i);
  const expectedMatch = error.match(/expected[:\s]+([a-zA-Z]+)/i);
  const receivedMatch = error.match(/received[:\s]+([a-zA-Z]+)/i);

  if (fieldPathMatch || expectedMatch || receivedMatch) {
    return {
      type: 'schema',
      fieldPath: fieldPathMatch?.[1],
      expectedType: expectedMatch?.[1],
      receivedType: receivedMatch?.[1],
      message: error,
      hint: expectedMatch && receivedMatch
        ? `Field should be ${expectedMatch[1]} but got ${receivedMatch[1]}`
        : 'Check the field type and format',
    };
  }

  return {
    type: 'general',
    message: error,
  };
}

export function formatErrorForDisplay(error: string): {
  icon: 'schema' | 'crosslink' | 'placeholder' | 'general';
  title: string;
  description: string;
  hint?: string;
} {
  const structured = parseValidationError(error);

  switch (structured.type) {
    case 'schema':
      return {
        icon: 'schema',
        title: structured.fieldPath || 'Schema Validation Error',
        description: structured.message,
        hint: structured.hint,
      };
    case 'crosslink':
      return {
        icon: 'crosslink',
        title: 'Broken Reference',
        description: structured.message,
        hint: structured.hint,
      };
    case 'placeholder':
      return {
        icon: 'placeholder',
        title: 'Placeholder Found',
        description: structured.message,
        hint: structured.hint,
      };
    default:
      return {
        icon: 'general',
        title: 'Validation Error',
        description: structured.message,
      };
  }
}
