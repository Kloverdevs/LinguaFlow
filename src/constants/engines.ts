import { TranslationEngine } from '@/types/translation';

export interface EngineInfo {
  id: TranslationEngine;
  name: string;
  requiresKey: boolean;
  defaultModel?: string;
  color: string;
}

export const ENGINES: EngineInfo[] = [
  { id: TranslationEngine.GOOGLE_FREE, name: 'Google Translate', requiresKey: false, color: '#4285F4' },
  { id: TranslationEngine.MICROSOFT, name: 'Microsoft Translator', requiresKey: true, color: '#0078D4' },
  { id: TranslationEngine.DEEPL, name: 'DeepL', requiresKey: true, color: '#0F2B46' },
  { id: TranslationEngine.OPENAI, name: 'OpenAI', requiresKey: true, defaultModel: 'gpt-4o-mini', color: '#10A37F' },
  { id: TranslationEngine.CLAUDE, name: 'Claude', requiresKey: true, defaultModel: 'claude-sonnet-4-5-20250514', color: '#D97757' },
];

export function getEngineInfo(engine: TranslationEngine): EngineInfo {
  return ENGINES.find((e) => e.id === engine)!;
}
