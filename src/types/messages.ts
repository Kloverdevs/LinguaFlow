import { TranslationEngine, TranslationResult } from './translation';
import { UserSettings } from './settings';

// Messages sent from content script or popup to background
export type MessageToBackground =
  | { type: 'TRANSLATE_REQUEST'; payload: { texts: string[]; sourceLang: string; targetLang: string; engine?: TranslationEngine } }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'VALIDATE_ENGINE'; payload: { engine: TranslationEngine } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'GET_CACHE_STATS' }
  | { type: 'DETECT_LANGUAGE'; payload: { text: string } };

// Messages sent from background or popup to content script
export type MessageToContent =
  | { type: 'TOGGLE_TRANSLATION' }
  | { type: 'TRANSLATE_PAGE' }
  | { type: 'TRANSLATE_SELECTION'; payload: { text: string } }
  | { type: 'REMOVE_TRANSLATIONS' }
  | { type: 'SETTINGS_CHANGED'; payload: UserSettings };

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
