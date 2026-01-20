import { parseAIResponse } from './parser';
import { safeError, safeWarn } from './debugLogger';

export interface AIClientConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AICallOptions {
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIValidationResult {
  valid: boolean;
  error?: string;
  model?: string;
}

export class APIKeyMissingError extends Error {
  constructor() {
    super('API key is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.');
    this.name = 'APIKeyMissingError';
  }
}

export class APIConnectionError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIConnectionError';
  }
}

export class CancellableAIClient {
  private config: AIClientConfig;
  private controller?: AbortController;

  constructor(config: AIClientConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1/chat/completions',
    };
  }

  async call(
    systemPrompt: string,
    userPrompt: string,
    options: AICallOptions = {}
  ): Promise<unknown> {
    this.controller = new AbortController();
    const signal = options.signal || this.controller.signal;
    const timeout = options.timeout || 120000;

    const timeoutId = setTimeout(() => {
      this.controller?.abort();
    }, timeout);

    try {
      const response = await fetch(this.config.baseUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'WebinarRev',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 8000,
        }),
        signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');

        if (response.status === 401) {
          throw new APIConnectionError(
            'Invalid API key. Please check your VITE_OPENROUTER_API_KEY configuration.',
            401
          );
        }

        if (response.status === 429) {
          throw new APIConnectionError(
            'API rate limit exceeded. Please wait a moment and try again.',
            429
          );
        }

        if (response.status === 402) {
          throw new APIConnectionError(
            'Insufficient credits on OpenRouter. Please add credits to your account.',
            402
          );
        }

        if (response.status >= 500) {
          throw new APIConnectionError(
            'OpenRouter service is temporarily unavailable. Please try again later.',
            response.status
          );
        }

        throw new APIConnectionError(`AI API error: ${response.status} ${errorText}`, response.status);
      }

      const responseText = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        safeError('Failed to parse response JSON', jsonError, {
          bodyLength: responseText.length,
          bodyPreview: responseText.slice(0, 500),
          contentType: response.headers.get('content-type'),
        });
        throw new APIConnectionError(
          `Received invalid JSON from AI provider (${responseText.length} chars). The response may be incomplete or corrupted.`,
          response.status
        );
      }

      const content = (data as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;

      if (!content) {
        safeWarn('No content in response', {
          hasChoices: Boolean((data as { choices?: unknown[] }).choices?.length),
          dataType: typeof data,
        });
        throw new Error('No content in AI response. The model may have returned an empty response.');
      }

      return parseAIResponse(content);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIConnectionError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new APIConnectionError('Request timed out or was cancelled. Please try again.');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIConnectionError('Network error. Please check your internet connection.');
      }

      throw error;
    }
  }

  abort(): void {
    if (this.controller) {
      this.controller.abort();
    }
  }

  getModel(): string {
    return this.config.model;
  }
}

export function isAPIKeyConfigured(): boolean {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}

export function getConfiguredModel(): string {
  return import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';
}

export async function validateAPIKey(): Promise<AIValidationResult> {
  if (!isAPIKeyConfigured()) {
    return {
      valid: false,
      error: 'API key is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.',
    };
  }

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = getConfiguredModel();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your VITE_OPENROUTER_API_KEY configuration.',
        };
      }
      return {
        valid: false,
        error: `API validation failed: ${response.status}`,
      };
    }

    return {
      valid: true,
      model,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate API key',
    };
  }
}

export function createAIClient(): CancellableAIClient {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    throw new APIKeyMissingError();
  }

  return new CancellableAIClient({ apiKey, model });
}
