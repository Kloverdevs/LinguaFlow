import { UserSettings } from '@/types/settings';
import { TranslationEngine } from '@/types/translation';

export const DEFAULT_SETTINGS: UserSettings = {
  sourceLang: 'auto',
  targetLang: 'en',
  engine: TranslationEngine.GOOGLE_FREE,
  engineConfigs: {},
  hoverMode: false,
  displayMode: 'replace',
  translationStyle: {
    fontSize: 0.92,
    fontFamily: 'inherit',
    color: '#555555',
    borderColor: '#4a90d9',
    italic: true,
  },
  onboardingCompleted: false,
  theme: 'system',
  showFreeEngines: true,
  showPaidEngines: true,
  autoTranslateSites: [],
  neverTranslateSites: [],
  popupScale: 1,
  uiLocale: 'auto',
  fabEnabled: true,
  fabSize: 48,
};
