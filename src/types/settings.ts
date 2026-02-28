import { TranslationEngine, EngineConfig } from './translation';

export type DisplayMode = 'replace' | 'bilingual';

export interface TranslationStyle {
  fontSize: number;
  color: string;
  borderColor: string;
  italic: boolean;
}

export interface UserSettings {
  sourceLang: string;
  targetLang: string;
  engine: TranslationEngine;
  engineConfigs: Partial<Record<TranslationEngine, EngineConfig>>;
  hoverMode: boolean;
  displayMode: DisplayMode;
  translationStyle: TranslationStyle;
  onboardingCompleted: boolean;
}
