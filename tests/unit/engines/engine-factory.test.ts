import { describe, it, expect } from 'vitest';
import { createEngine } from '@/engines';
import { TranslationEngine } from '@/types/translation';
import { GoogleTranslateEngine } from '@/engines/google-translate';
import { DeepLEngine } from '@/engines/deepl-engine';
import { OpenAIEngine } from '@/engines/openai-engine';
import { ClaudeEngine } from '@/engines/claude-engine';
import { MicrosoftTranslateEngine } from '@/engines/microsoft-engine';

describe('createEngine', () => {
  it('creates GoogleTranslateEngine for GOOGLE_FREE', () => {
    const engine = createEngine(TranslationEngine.GOOGLE_FREE, {
      engine: TranslationEngine.GOOGLE_FREE,
    });
    expect(engine).toBeInstanceOf(GoogleTranslateEngine);
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
