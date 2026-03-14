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

  async detectLanguage(_text: string): Promise<string | null> {
    return null;
  }

  async explain(_text: string, _sourceLang: string, _targetLang: string): Promise<string> {
    throw new Error('Grammar explanation is not supported by this engine. Please select an AI engine like OpenAI or Claude.');
  }

  async translateImage?(imageBase64: string, sourceLang: string, targetLang: string): Promise<string>;
}
