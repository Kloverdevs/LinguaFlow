import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MicrosoftTranslateEngine } from '@/engines/microsoft-engine';
import { TranslationEngine } from '@/types/translation';

describe('MicrosoftTranslateEngine', () => {
  let engine: MicrosoftTranslateEngine;

  beforeEach(() => {
    engine = new MicrosoftTranslateEngine({
      engine: TranslationEngine.MICROSOFT,
      apiKey: 'test-key',
    });
    vi.restoreAllMocks();
  });

  it('has max batch size of 25', () => {
    expect(engine.getMaxBatchSize()).toBe(25);
  });

  it('translates texts using Microsoft API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { translations: [{ text: 'Hola' }] },
        { translations: [{ text: 'Mundo' }] },
      ]),
    }));

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('sends Ocp-Apim-Subscription-Key header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { translations: [{ text: 'Hola' }] },
      ]),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const headers = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['Ocp-Apim-Subscription-Key']).toBe('test-key');
  });

  it('omits from parameter when source lang is auto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { translations: [{ text: 'Hello' }] },
      ]),
    }));

    await engine.translate(['Hola'], 'auto', 'en');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain('from=');
    expect(url).toContain('to=en');
  });

  it('includes from parameter for specific source lang', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { translations: [{ text: 'Hola' }] },
      ]),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('from=en');
  });

  it('throws friendly message on 401 error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow(
      'Microsoft Translator API key is invalid'
    );
  });

  it('throws on missing API key', async () => {
    const noKeyEngine = new MicrosoftTranslateEngine({
      engine: TranslationEngine.MICROSOFT,
    });

    await expect(noKeyEngine.translate(['Hello'], 'en', 'es')).rejects.toThrow(
      'Microsoft Translator API key not set'
    );
  });
});
