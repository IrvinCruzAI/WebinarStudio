const isDev = import.meta.env.DEV || import.meta.env.VITE_WRV_DEBUG === 'true';

const MAX_PREVIEW_LENGTH = 200;

function redact(content: unknown): string {
  if (content === null || content === undefined) {
    return String(content);
  }

  const str = typeof content === 'string' ? content : JSON.stringify(content);
  if (str.length <= MAX_PREVIEW_LENGTH) {
    return str;
  }

  return `${str.substring(0, MAX_PREVIEW_LENGTH)}... [REDACTED ${str.length - MAX_PREVIEW_LENGTH} chars]`;
}

export function safeLog(message: string, ...args: unknown[]): void {
  if (!isDev) return;

  const redactedArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return redact(arg);
    }
    return redact(arg);
  });

  console.log(`[WRV1] ${message}`, ...redactedArgs);
}

export function safeWarn(message: string, meta?: Record<string, unknown>): void {
  if (!isDev) return;

  const safeMeta: Record<string, unknown> = {};

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (key.toLowerCase().includes('content') ||
          key.toLowerCase().includes('body') ||
          key.toLowerCase().includes('text') ||
          key.toLowerCase().includes('transcript')) {
        safeMeta[key] = typeof value === 'string'
          ? `[${value.length} chars]`
          : `[${JSON.stringify(value).length} chars]`;
      } else {
        safeMeta[key] = value;
      }
    }
  }

  console.warn(`[WRV1 WARN] ${message}`, safeMeta);
}

export function safeError(message: string, error?: unknown, meta?: Record<string, unknown>): void {
  if (!isDev) return;

  const safeMeta: Record<string, unknown> = { ...meta };

  if (error instanceof Error) {
    safeMeta.errorName = error.name;
    safeMeta.errorMessage = error.message;
    safeMeta.errorStack = error.stack?.split('\n').slice(0, 3).join('\n');
  } else if (error) {
    safeMeta.error = redact(error);
  }

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (key.toLowerCase().includes('content') ||
          key.toLowerCase().includes('body') ||
          key.toLowerCase().includes('text') ||
          key.toLowerCase().includes('transcript')) {
        safeMeta[key] = typeof value === 'string'
          ? `[${value.length} chars]`
          : `[${JSON.stringify(value).length} chars]`;
      }
    }
  }

  console.error(`[WRV1 ERROR] ${message}`, safeMeta);
}

export function logParseAttempt(deliverableId: string, contentLength: number, attempt: number): void {
  if (!isDev) return;
  console.log(`[WRV1 Parse] ${deliverableId} - Attempt ${attempt} - Content length: ${contentLength} chars`);
}

export function logApiCall(method: string, url: string, status?: number, contentType?: string): void {
  if (!isDev) return;
  console.log(`[WRV1 API] ${method} ${url}`, { status, contentType });
}
