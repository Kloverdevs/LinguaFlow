export enum TranslationEngine {
  GOOGLE_FREE = 'google_free',
  DEEPL = 'deepl',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  MICROSOFT = 'microsoft',
}

export interface TranslationRequest {
  texts: string[];
  sourceLang: string;
  targetLang: string;
  engine: TranslationEngine;
}

export interface TranslationResult {
  originalTexts: string[];
  translatedTexts: string[];
  detectedSourceLang?: string;
  engine: TranslationEngine;
  cached: boolean;
  timestamp: number;
}

export interface EngineConfig {
  engine: TranslationEngine;
  apiKey?: string;
  model?: string;
  customEndpoint?: string;
}
