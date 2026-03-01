import { TranslationEngine, EngineConfig } from '@/types/translation';
import { BaseTranslationEngine } from './base-engine';
import { GoogleTranslateEngine } from './google-translate';
import { DeepLEngine } from './deepl-engine';
import { OpenAIEngine } from './openai-engine';
import { ClaudeEngine } from './claude-engine';
import { MicrosoftTranslateEngine } from './microsoft-engine';
import { ChromeBuiltinEngine } from './chrome-builtin-engine';
import { BingFreeEngine } from './bing-free-engine';
import { YandexEngine } from './yandex-engine';
import { LingvaEngine } from './lingva-engine';
import { MyMemoryEngine } from './mymemory-engine';
import { LibreTranslateEngine } from './libre-engine';

export function createEngine(
  type: TranslationEngine,
  config: EngineConfig
): BaseTranslationEngine {
  switch (type) {
    case TranslationEngine.GOOGLE_FREE:
      return new GoogleTranslateEngine(config);
    case TranslationEngine.BING_FREE:
      return new BingFreeEngine(config);
    case TranslationEngine.YANDEX:
      return new YandexEngine(config);
    case TranslationEngine.LINGVA:
      return new LingvaEngine(config);
    case TranslationEngine.MYMEMORY:
      return new MyMemoryEngine(config);
    case TranslationEngine.LIBRE_TRANSLATE:
      return new LibreTranslateEngine(config);
    case TranslationEngine.DEEPL:
      return new DeepLEngine(config);
    case TranslationEngine.OPENAI:
      return new OpenAIEngine(config);
    case TranslationEngine.CLAUDE:
      return new ClaudeEngine(config);
    case TranslationEngine.MICROSOFT:
      return new MicrosoftTranslateEngine(config);
    case TranslationEngine.CHROME_BUILTIN:
      return new ChromeBuiltinEngine(config);
    default:
      throw new Error(`Unknown translation engine: ${type}`);
  }
}

export { BaseTranslationEngine } from './base-engine';
