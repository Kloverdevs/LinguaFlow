import { EngineConfig } from '@/types/translation';

export abstract class BaseTranslationEngine {
  protected config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  abstract translate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<string[]>;

  abstract validateConfig(): Promise<{ valid: boolean; error?: string }>;

  abstract getMaxBatchSize(): number;

  async detectLanguage(_text: string): Promise<string | null> {
    return null;
  }
}
