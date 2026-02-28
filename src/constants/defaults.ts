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
    color: '#555555',
    borderColor: '#4a90d9',
    italic: true,
  },
  onboardingCompleted: false,
};
