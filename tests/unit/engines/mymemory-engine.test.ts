import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyMemoryEngine } from '@/engines/mymemory-engine';
import { TranslationEngine } from '@/types/translation';

describe('MyMemoryEngine', () => {
  let engine: MyMemoryEngine;

  beforeEach(() => {
    engine = new MyMemoryEngine({ engine: TranslationEngine.MYMEMORY });
    vi.restoreAllMocks();
  });

  it('has max batch size of 1', () => {
    expect(engine.getMaxBatchSize()).toBe(1);
  });

  it('translates a single text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        responseStatus: 200,
        responseData: { translatedText: 'Hola' },
      }),
    }));

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
  });

  it('uses correct langpair format', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        responseStatus: 200,
        responseData: { translatedText: 'Hola' },
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('langpair=en%7Ces');
  });

  it('falls back to en when source is auto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        responseStatus: 200,
        responseData: { translatedText: 'Hello' },
      }),
    }));

    await engine.translate(['Hola'], 'auto', 'en');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('langpair=en%7Cen');
  });

  it('includes email as de parameter when API key provided', async () => {
    const engineWithKey = new MyMemoryEngine({
      engine: TranslationEngine.MYMEMORY,
      apiKey: 'user@example.com',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        responseStatus: 200,
        responseData: { translatedText: 'Hola' },
      }),
    }));

    await engineWithKey.translate(['Hello'], 'en', 'es');
    const url = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('de=user%40example.com');
  });

  it('throws on non-200 responseStatus', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        responseStatus: 403,
        responseDetails: 'QUOTA EXCEEDED',
      }),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow('QUOTA EXCEEDED');
  });

  it('validates config successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        responseStatus: 200,
        responseData: { translatedText: 'Hola' },
      }),
    }));

    const result = await engine.validateConfig();
    expect(result).toEqual({ valid: true });
  });
});
