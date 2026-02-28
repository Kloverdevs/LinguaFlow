import { TranslationEngine, EngineConfig } from '@/types/translation';
import { BaseTranslationEngine } from './base-engine';
import { GoogleTranslateEngine } from './google-translate';
import { DeepLEngine } from './deepl-engine';
import { OpenAIEngine } from './openai-engine';
import { ClaudeEngine } from './claude-engine';
import { MicrosoftTranslateEngine } from './microsoft-engine';

export function createEngine(
  type: TranslationEngine,
  config: EngineConfig
): BaseTranslationEngine {
  switch (type) {
    case TranslationEngine.GOOGLE_FREE:
      return new GoogleTranslateEngine(config);
    case TranslationEngine.DEEPL:
      return new DeepLEngine(config);
    case TranslationEngine.OPENAI:
      return new OpenAIEngine(config);
    case TranslationEngine.CLAUDE:
      return new ClaudeEngine(config);
    case TranslationEngine.MICROSOFT:
      return new MicrosoftTranslateEngine(config);
    default:
      throw new Error(`Unknown translation engine: ${type}`);
  }
}

export { BaseTranslationEngine } from './base-engine';
