import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIEngine } from '@/engines/openai-engine';
import { TranslationEngine } from '@/types/translation';

describe('OpenAIEngine', () => {
  let engine: OpenAIEngine;

  beforeEach(() => {
    engine = new OpenAIEngine({
      engine: TranslationEngine.OPENAI,
      apiKey: 'test-key',
    });
    vi.restoreAllMocks();
  });

  it('has max batch size of 10', () => {
    expect(engine.getMaxBatchSize()).toBe(10);
  });

  it('translates a single text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Hola' } }],
      }),
    }));

    const result = await engine.translate(['Hello'], 'en', 'es');
    expect(result).toEqual(['Hola']);
  });

  it('translates multiple texts with separator', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Hola\n---SPLIT---\nMundo' } }],
      }),
    }));

    const result = await engine.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('sends correct Authorization header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Hola' } }],
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const headers = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer test-key');
  });

  it('uses default model gpt-4o-mini', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Hola' } }],
      }),
    }));

    await engine.translate(['Hello'], 'en', 'es');
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.model).toBe('gpt-4o-mini');
  });

  it('uses custom model when configured', async () => {
    const customEngine = new OpenAIEngine({
      engine: TranslationEngine.OPENAI,
      apiKey: 'test-key',
      model: 'gpt-4o',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Hola' } }],
      }),
    }));

    await customEngine.translate(['Hello'], 'en', 'es');
    const body = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.model).toBe('gpt-4o');
  });

  it('throws on API error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    }));

    await expect(engine.translate(['Hello'], 'en', 'es')).rejects.toThrow(
      'OpenAI API error 401'
    );
  });

  it('validates config returns invalid when no API key', async () => {
    const noKeyEngine = new OpenAIEngine({
      engine: TranslationEngine.OPENAI,
    });

    const result = await noKeyEngine.validateConfig();
    expect(result).toEqual({ valid: false, error: 'API key is required' });
  });
});
