export interface VocabEntry {
  id: string;
  text: string;           // Original word/phrase
  translation: string;    // Translated text
  sourceLang: string;
  targetLang: string;
  context?: string;       // Surrounding sentence for context
  sourceUrl?: string;     // URL where it was saved
  timestamp: number;      // Epoch time when saved
}
