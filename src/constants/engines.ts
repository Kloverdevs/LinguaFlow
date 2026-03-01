import { TranslationEngine } from '@/types/translation';

export interface EngineInfo {
  id: TranslationEngine;
  name: string;
  requiresKey: boolean;
  defaultModel?: string;
  color: string;
  description: string;
}

export const ENGINES: EngineInfo[] = [
  { id: TranslationEngine.GOOGLE_FREE, name: 'Google Translate', requiresKey: false, color: '#4285F4', description: 'Free Google endpoint, no key needed' },
  { id: TranslationEngine.BING_FREE, name: 'Bing Translate', requiresKey: false, color: '#0078D4', description: 'Free Microsoft Edge translation' },
  { id: TranslationEngine.YANDEX, name: 'Yandex Translate', requiresKey: false, color: '#FC3F1D', description: 'Free Yandex translation service' },
  { id: TranslationEngine.LINGVA, name: 'Lingva', requiresKey: false, color: '#4CAF50', description: 'Privacy-focused Google Translate proxy' },
  { id: TranslationEngine.MYMEMORY, name: 'MyMemory', requiresKey: false, color: '#FF9800', description: 'Free crowdsourced translation memory' },
  { id: TranslationEngine.LIBRE_TRANSLATE, name: 'LibreTranslate', requiresKey: false, color: '#1976D2', description: 'Open source, self-hostable' },
  { id: TranslationEngine.MICROSOFT, name: 'Microsoft Translator', requiresKey: true, color: '#0078D4', description: 'Azure Cognitive Services' },
  { id: TranslationEngine.DEEPL, name: 'DeepL', requiresKey: true, color: '#0F2B46', description: 'High-quality neural translation' },
  { id: TranslationEngine.OPENAI, name: 'OpenAI', requiresKey: true, defaultModel: 'gpt-4o-mini', color: '#10A37F', description: 'GPT-powered translation' },
  { id: TranslationEngine.CLAUDE, name: 'Claude', requiresKey: true, defaultModel: 'claude-sonnet-4-5-20250514', color: '#D97757', description: 'Anthropic AI translation' },
  { id: TranslationEngine.CHROME_BUILTIN, name: 'Offline (Chrome Built-in)', requiresKey: false, color: '#3367D6', description: 'On-device private translation' },
];

export function getEngineInfo(engine: TranslationEngine): EngineInfo {
  return ENGINES.find((e) => e.id === engine)!;
}
