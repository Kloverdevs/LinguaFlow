import { EngineConfig } from '@/types/translation';

export abstract class BaseTranslationEngine {
  protected config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  abstract translate(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    onStream?: (chunk: string) => void
  ): Promise<string[]>;

  abstract validateConfig(): Promise<{ valid: boolean; error?: string }>;

  abstract getMaxBatchSize(): number;

  /** Maximum retries for rate-limited or server error responses */
  private static readonly MAX_RETRIES = 3;
  /** Base delay in ms for exponential backoff */
  private static readonly RETRY_BASE_MS = 1000;

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch with automatic retry on 429 (rate limit) and 5xx (server errors).
   * Uses exponential backoff with jitter. Respects Retry-After header.
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    timeoutMs = 30000
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= BaseTranslationEngine.MAX_RETRIES; attempt++) {
      const response = await this.fetchWithTimeout(url, options, timeoutMs);
      if (response.ok || (response.status < 429)) {
        return response;
      }
      // Retry on rate limit (429) or server errors (500-599)
      if (response.status === 429 || response.status >= 500) {
        if (attempt === BaseTranslationEngine.MAX_RETRIES) {
          const text = await response.text();
          throw new Error(`API error ${response.status} after ${BaseTranslationEngine.MAX_RETRIES + 1} attempts: ${text}`);
        }
        const retryAfter = response.headers.get('retry-after');
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BaseTranslationEngine.RETRY_BASE_MS * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(r => setTimeout(r, delayMs));
        lastError = new Error(`API error ${response.status}`);
        continue;
      }
      // Non-retryable error — return response for caller to handle
      return response;
    }
    throw lastError ?? new Error('Unexpected retry loop exit');
  }

  async detectLanguage(_text: string): Promise<string | null> {
    return null;
  }

  async explain(_text: string, _sourceLang: string, _targetLang: string): Promise<string> {
    throw new Error('Grammar explanation is not supported by this engine. Please select an AI engine like OpenAI or Claude.');
  }

  async translateImage?(imageBase64: string, sourceLang: string, targetLang: string): Promise<string>;
}
