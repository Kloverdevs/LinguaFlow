import { TranslationEngine, TranslationResult } from './translation';
import { UserSettings } from './settings';

// Messages sent from content script or popup to background
export type MessageToBackground =
  | { type: 'TRANSLATE_REQUEST'; payload: { texts: string[]; sourceLang: string; targetLang: string; engine?: TranslationEngine } }
  | { type: 'EXPLAIN_GRAMMAR_REQUEST'; payload: { text: string; sourceLang: string; targetLang: string } }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'VALIDATE_ENGINE'; payload: { engine: TranslationEngine } }
  | { type: 'CLEAR_CACHE' }
  | { type: 'GET_CACHE_STATS' }
  | { type: 'DETECT_LANGUAGE'; payload: { text: string } }
  | { type: 'TRANSLATE_IMAGE_REQUEST'; payload: { imageBase64: string; sourceLang: string; targetLang: string; engine?: TranslationEngine } };

// Messages sent from background or popup to content script
export type MessageToContent =
  | { type: 'TOGGLE_TRANSLATION' }
  | { type: 'TOGGLE_HOVER_MODE' }
  | { type: 'TRANSLATE_CURRENT_SELECTION' }
  | { type: 'TRANSLATE_PAGE' }
  | { type: 'TRANSLATE_SELECTION'; payload: { text: string } }
  | { type: 'REMOVE_TRANSLATIONS' }
  | { type: 'SETTINGS_CHANGED'; payload: UserSettings }
  | { type: 'TRANSLATION_STREAM_CHUNK'; payload: { chunk: string } }
  | { type: 'TRANSLATE_IMAGE'; payload: { srcUrl: string } };

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
