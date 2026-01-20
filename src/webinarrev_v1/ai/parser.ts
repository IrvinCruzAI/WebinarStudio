import { safeWarn, safeError } from './debugLogger';

function findBalancedJSON(text: string, startIndex: number): { json: string; endIndex: number } | null {
  const startChar = text[startIndex];
  if (startChar !== '{' && startChar !== '[') {
    return null;
  }

  const closingChar = startChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === startChar) {
      depth++;
    } else if (char === closingChar) {
      depth--;
      if (depth === 0) {
        return {
          json: text.slice(startIndex, i + 1),
          endIndex: i,
        };
      }
    }
  }

  return null;
}

function findBalancedJSONBackward(text: string, endIndex: number): { json: string; startIndex: number } | null {
  const endChar = text[endIndex];
  if (endChar !== '}' && endChar !== ']') {
    return null;
  }

  const openingChar = endChar === '}' ? '{' : '[';
  let depth = 0;
  let inString = false;

  const chars = text.split('').slice(0, endIndex + 1);
  const stringPositions: boolean[] = [];

  let tempInString = false;
  let tempEscapeNext = false;
  for (let i = 0; i <= endIndex; i++) {
    const char = text[i];
    if (tempEscapeNext) {
      tempEscapeNext = false;
      stringPositions[i] = tempInString;
      continue;
    }
    if (char === '\\' && tempInString) {
      tempEscapeNext = true;
      stringPositions[i] = tempInString;
      continue;
    }
    if (char === '"') {
      tempInString = !tempInString;
    }
    stringPositions[i] = tempInString;
  }

  for (let i = endIndex; i >= 0; i--) {
    const char = text[i];

    if (stringPositions[i]) continue;

    if (char === endChar) {
      depth++;
    } else if (char === openingChar) {
      depth--;
      if (depth === 0) {
        return {
          json: text.slice(i, endIndex + 1),
          startIndex: i,
        };
      }
    }
  }

  return null;
}

function stripCodeFences(text: string): string {
  let cleaned = text;

  cleaned = cleaned.replace(/^```(?:json|javascript|typescript|js|ts)?\s*\n?/gm, '');
  cleaned = cleaned.replace(/\n?```\s*$/gm, '');

  return cleaned;
}

function findFirstJSONStart(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') {
      return i;
    }
  }
  return -1;
}

function findLastJSONEnd(text: string): number {
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === '}' || text[i] === ']') {
      return i;
    }
  }
  return -1;
}

export function parseAIResponse(raw: string): unknown {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty or invalid AI response');
  }

  let text = stripCodeFences(raw.trim());

  const firstStart = findFirstJSONStart(text);
  if (firstStart === -1) {
    throw new Error('No JSON structure found in response');
  }

  const forwardResult = findBalancedJSON(text, firstStart);
  if (forwardResult) {
    try {
      return JSON.parse(forwardResult.json);
    } catch (error) {
      safeWarn('Forward parse failed', {
        error: error instanceof Error ? error.message : String(error),
        jsonLength: forwardResult.json.length,
      });
    }
  }

  const lastEnd = findLastJSONEnd(text);
  if (lastEnd !== -1) {
    const backwardResult = findBalancedJSONBackward(text, lastEnd);
    if (backwardResult) {
      try {
        return JSON.parse(backwardResult.json);
      } catch (error) {
        safeWarn('Backward parse failed', {
          error: error instanceof Error ? error.message : String(error),
          jsonLength: backwardResult.json.length,
        });
      }
    }
  }

  for (let i = firstStart; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') {
      const result = findBalancedJSON(text, i);
      if (result) {
        try {
          return JSON.parse(result.json);
        } catch (error) {
          safeWarn(`Iterative parse failed at position ${i}`, {
            error: error instanceof Error ? error.message : String(error),
            jsonLength: result.json.length,
          });
          continue;
        }
      }
    }
  }

  const trimmedStart = text.indexOf('{');
  const arrayStart = text.indexOf('[');
  const actualStart = Math.min(
    trimmedStart === -1 ? Infinity : trimmedStart,
    arrayStart === -1 ? Infinity : arrayStart
  );

  if (actualStart !== Infinity) {
    const trimmedEnd = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (trimmedEnd > actualStart) {
      const candidate = text.slice(actualStart, trimmedEnd + 1);
      try {
        return JSON.parse(candidate);
      } catch (error) {
        safeWarn('Final fallback parse failed', {
          error: error instanceof Error ? error.message : String(error),
          candidateLength: candidate.length,
        });
      }
    }
  }

  const errorContext = {
    textLength: text.length,
    foundJSONStart: firstStart !== -1,
    foundJSONEnd: lastEnd !== -1,
  };

  safeError('All parsing strategies failed', undefined, errorContext);
  throw new Error(
    `Failed to extract valid JSON from AI response. ` +
    `Text length: ${text.length} chars. ` +
    `Check console for full error context.`
  );
}

export function extractJSONFromMarkdown(text: string): unknown {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);

  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (error) {
      safeWarn('Code block parse failed', {
        error: error instanceof Error ? error.message : String(error),
        blockLength: codeBlockMatch[1].length,
      });
    }
  }

  return parseAIResponse(text);
}

export function safeParseJSON<T>(raw: string, fallback: T): T {
  try {
    return parseAIResponse(raw) as T;
  } catch {
    return fallback;
  }
}
