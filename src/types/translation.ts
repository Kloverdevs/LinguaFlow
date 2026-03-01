export enum TranslationEngine {
  GOOGLE_FREE = 'google_free',
  BING_FREE = 'bing_free',
  YANDEX = 'yandex',
  LINGVA = 'lingva',
  MYMEMORY = 'mymemory',
  LIBRE_TRANSLATE = 'libre_translate',
  DEEPL = 'deepl',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  MICROSOFT = 'microsoft',
  CHROME_BUILTIN = 'chrome_builtin',
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
  customPrompt?: string;
  formality?: 'auto' | 'formal' | 'informal';
  tabId?: number;
}
