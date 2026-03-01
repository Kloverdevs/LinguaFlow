import { TranslationEngine, EngineConfig } from './translation';

export type DisplayMode = 'replace' | 'bilingual';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface TranslationStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  borderColor: string;
  italic: boolean;
}

export type UILocale = 'auto' | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ko' | 'ru' | 'ar' | 'it';

export interface UserSettings {
  sourceLang: string;
  targetLang: string;
  engine: TranslationEngine;
  engineConfigs: Partial<Record<TranslationEngine, EngineConfig>>;
  hoverMode: boolean;
  displayMode: DisplayMode;
  translationStyle: TranslationStyle;
  onboardingCompleted: boolean;
  theme: ThemeMode;
  showFreeEngines: boolean;
  showPaidEngines: boolean;
  autoTranslateSites: string[];
  neverTranslateSites: string[];
  popupScale: number;
  uiLocale: UILocale;
  fabEnabled: boolean;
  fabSize: number; // px, default 48
}
