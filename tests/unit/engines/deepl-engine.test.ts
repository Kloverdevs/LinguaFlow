import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepLEngine } from '@/engines/deepl-engine';
import { TranslationEngine } from '@/types/translation';

describe('DeepLEngine', () => {
  let engine: DeepLEngine;

  beforeEach(() => {
    engine = new DeepLEngine({
      engine: TranslationEngine.DEEPL,
      apiKey: 'test-key:fx',
    });
    vi.restoreAllMocks();
  });

  it('has max batch size of 50', () => {
    expect(engine.getMaxBatchSize()).toBe(50);
  });

  it('uses free endpoint for keys ending with :fx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: [{ text: 'Hola' }],
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('api-free.deepl.com');
  });

  it('uses pro endpoint for keys without :fx', async () => {
    const proEngine = new DeepLEngine({
      engine: TranslationEngine.DEEPL,
      apiKey: 'test-pro-key',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: [{ text: 'Hola' }],
      }),
    }));

    await proEngine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('api.deepl.com');
    expect(url).not.toContain('api-free');
  });

  it('translates a batch of texts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: [{ text: 'Hola' }, { text: 'Mundo' }],
      }),
    }));

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('omits source_lang when set to auto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: [{ text: 'Hello' }],
      }),
    }));

    await engine.translate(['Hola'], 'auto', 'en');
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.source_lang).toBeUndefined();
  });

  it('sends Authorization header with DeepL-Auth-Key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: [{ text: 'Hola' }],
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const headers = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('DeepL-Auth-Key test-key:fx');
  });

  it('throws friendly message on 403 error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow(
      'DeepL API key is invalid or unauthorized'
    );
  });

  it('throws friendly message on 456 quota error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 456,
      text: () => Promise.resolve('Quota exceeded'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow(
      'DeepL quota exceeded'
    );
  });

  it('validates config returns invalid when no API key', async () => {
    const noKeyEngine = new DeepLEngine({
      engine: TranslationEngine.DEEPL,
    });

    const result = await noKeyEngine.validateConfig();
    expect(result).toEqual({ valid: false, error: 'API key is required' });
  });

  it('validates config on successful test translation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: [{ text: 'Hola' }],
      }),
    }));

    const result = await engine.validateConfig();
    expect(result).toEqual({ valid: true });
  });
});
