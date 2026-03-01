import { describe, it, expect } from 'vitest';
import { ENGINES, getEngineInfo } from '@/constants/engines';
import { TranslationEngine } from '@/types/translation';

describe('ENGINES', () => {
  it('has 11 engines defined', () => {
    expect(ENGINES).toHaveLength(11);
  });

  it('has 7 free engines', () => {
    const free = ENGINES.filter((e) => !e.requiresKey);
    expect(free).toHaveLength(7);
  });

  it('has 4 paid engines', () => {
    const paid = ENGINES.filter((e) => e.requiresKey);
    expect(paid).toHaveLength(4);
  });

  it('every engine has required fields', () => {
    for (const engine of ENGINES) {
      expect(engine.id).toBeTruthy();
      expect(engine.name).toBeTruthy();
      expect(typeof engine.requiresKey).toBe('boolean');
      expect(engine.color).toMatch(/^#/);
      expect(engine.description).toBeTruthy();
    }
  });

  it('paid engines include DeepL, OpenAI, Claude, Microsoft', () => {
    const paidIds = ENGINES.filter((e) => e.requiresKey).map((e) => e.id);
    expect(paidIds).toContain(TranslationEngine.DEEPL);
    expect(paidIds).toContain(TranslationEngine.OPENAI);
    expect(paidIds).toContain(TranslationEngine.CLAUDE);
    expect(paidIds).toContain(TranslationEngine.MICROSOFT);
  });

  it('free engines include Google, Bing, Yandex, Lingva, MyMemory, Libre', () => {
    const freeIds = ENGINES.filter((e) => !e.requiresKey).map((e) => e.id);
    expect(freeIds).toContain(TranslationEngine.GOOGLE_FREE);
    expect(freeIds).toContain(TranslationEngine.BING_FREE);
    expect(freeIds).toContain(TranslationEngine.YANDEX);
    expect(freeIds).toContain(TranslationEngine.LINGVA);
    expect(freeIds).toContain(TranslationEngine.MYMEMORY);
    expect(freeIds).toContain(TranslationEngine.LIBRE_TRANSLATE);
  });
});

describe('getEngineInfo', () => {
  it('returns correct info for Google Free', () => {
    const info = getEngineInfo(TranslationEngine.GOOGLE_FREE);
    expect(info.name).toBe('Google Translate');
    expect(info.requiresKey).toBe(false);
  });

  it('returns correct info for DeepL', () => {
    const info = getEngineInfo(TranslationEngine.DEEPL);
    expect(info.name).toBe('DeepL');
    expect(info.requiresKey).toBe(true);
  });

  it('returns correct info for OpenAI', () => {
    const info = getEngineInfo(TranslationEngine.OPENAI);
    expect(info.name).toBe('OpenAI');
    expect(info.requiresKey).toBe(true);
    expect(info.defaultModel).toBeTruthy();
  });

  it('returns correct info for Claude', () => {
    const info = getEngineInfo(TranslationEngine.CLAUDE);
    expect(info.name).toBe('Claude');
    expect(info.requiresKey).toBe(true);
    expect(info.defaultModel).toBeTruthy();
  });
});
