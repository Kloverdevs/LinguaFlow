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

  async detectLanguage(_text: string): Promise<string | null> {
    return null;
  }

  async explain(_text: string, _sourceLang: string, _targetLang: string): Promise<string> {
    throw new Error('Grammar explanation is not supported by this engine. Please select an AI engine like OpenAI or Claude.');
  }

  async translateImage?(imageBase64: string, sourceLang: string, targetLang: string): Promise<string>;
}
