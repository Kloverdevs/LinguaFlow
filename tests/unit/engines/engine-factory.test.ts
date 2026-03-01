import { describe, it, expect } from 'vitest';
import { createEngine } from '@/engines';
import { TranslationEngine } from '@/types/translation';
import { GoogleTranslateEngine } from '@/engines/google-translate';
import { DeepLEngine } from '@/engines/deepl-engine';
import { OpenAIEngine } from '@/engines/openai-engine';
import { ClaudeEngine } from '@/engines/claude-engine';
import { MicrosoftTranslateEngine } from '@/engines/microsoft-engine';
import { BingFreeEngine } from '@/engines/bing-free-engine';
import { YandexEngine } from '@/engines/yandex-engine';
import { LingvaEngine } from '@/engines/lingva-engine';
import { MyMemoryEngine } from '@/engines/mymemory-engine';
import { LibreTranslateEngine } from '@/engines/libre-engine';

describe('createEngine', () => {
  it('creates GoogleTranslateEngine for GOOGLE_FREE', () => {
    const engine = createEngine(TranslationEngine.GOOGLE_FREE, {
      engine: TranslationEngine.GOOGLE_FREE,
    });
    expect(engine).toBeInstanceOf(GoogleTranslateEngine);
  });

  it('creates BingFreeEngine for BING_FREE', () => {
    const engine = createEngine(TranslationEngine.BING_FREE, {
      engine: TranslationEngine.BING_FREE,
    });
    expect(engine).toBeInstanceOf(BingFreeEngine);
  });

  it('creates YandexEngine for YANDEX', () => {
    const engine = createEngine(TranslationEngine.YANDEX, {
      engine: TranslationEngine.YANDEX,
    });
    expect(engine).toBeInstanceOf(YandexEngine);
  });

  it('creates LingvaEngine for LINGVA', () => {
    const engine = createEngine(TranslationEngine.LINGVA, {
      engine: TranslationEngine.LINGVA,
    });
    expect(engine).toBeInstanceOf(LingvaEngine);
  });

  it('creates MyMemoryEngine for MYMEMORY', () => {
    const engine = createEngine(TranslationEngine.MYMEMORY, {
      engine: TranslationEngine.MYMEMORY,
    });
    expect(engine).toBeInstanceOf(MyMemoryEngine);
  });

  it('creates LibreTranslateEngine for LIBRE_TRANSLATE', () => {
    const engine = createEngine(TranslationEngine.LIBRE_TRANSLATE, {
      engine: TranslationEngine.LIBRE_TRANSLATE,
    });
    expect(engine).toBeInstanceOf(LibreTranslateEngine);
  });

  it('creates DeepLEngine for DEEPL', () => {
    const engine = createEngine(TranslationEngine.DEEPL, {
      engine: TranslationEngine.DEEPL,
      apiKey: 'test-key',
    });
    expect(engine).toBeInstanceOf(DeepLEngine);
  });

  it('creates OpenAIEngine for OPENAI', () => {
    const engine = createEngine(TranslationEngine.OPENAI, {
      engine: TranslationEngine.OPENAI,
      apiKey: 'test-key',
    });
    expect(engine).toBeInstanceOf(OpenAIEngine);
  });

  it('creates ClaudeEngine for CLAUDE', () => {
    const engine = createEngine(TranslationEngine.CLAUDE, {
      engine: TranslationEngine.CLAUDE,
      apiKey: 'test-key',
    });
    expect(engine).toBeInstanceOf(ClaudeEngine);
  });

  it('creates MicrosoftTranslateEngine for MICROSOFT', () => {
    const engine = createEngine(TranslationEngine.MICROSOFT, {
      engine: TranslationEngine.MICROSOFT,
      apiKey: 'test-key',
    });
    expect(engine).toBeInstanceOf(MicrosoftTranslateEngine);
  });

  it('throws for unknown engine type', () => {
    expect(() =>
      createEngine('unknown' as TranslationEngine, {
        engine: 'unknown' as TranslationEngine,
      })
    ).toThrow('Unknown translation engine');
  });
});
