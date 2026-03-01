import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, saveSettings, updateSettings } from '@/shared/storage';
import { DEFAULT_SETTINGS } from '@/constants/defaults';
import { TranslationEngine } from '@/types/translation';

describe('storage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSettings', () => {
    it('returns default settings when storage is empty', async () => {
      chrome.storage.local.get = vi.fn((keys: any, cb?: any) => {
        if (typeof cb === 'function') cb({});
        else if (typeof keys === 'function') keys({});
        return Promise.resolve({});
      });

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns stored settings when available', async () => {
      const stored = { ...DEFAULT_SETTINGS, targetLang: 'es' };
      chrome.storage.local.get = vi.fn((keys: any, cb?: any) => {
        if (typeof cb === 'function') cb({ settings: stored });
        else if (typeof keys === 'function') keys({ settings: stored });
        return Promise.resolve({ settings: stored });
      });

      const settings = await getSettings();
      expect(settings.targetLang).toBe('es');
    });
  });

  describe('saveSettings', () => {
    it('saves settings to chrome.storage.local', async () => {
      chrome.storage.local.set = vi.fn((items: any, cb?: any) => {
        if (typeof cb === 'function') cb();
        else if (typeof items === 'function') items();
        return Promise.resolve();
      });

      await saveSettings(DEFAULT_SETTINGS);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { settings: DEFAULT_SETTINGS },
        expect.any(Function)
      );
    });
  });

  describe('updateSettings', () => {
    it('merges partial settings with current settings', async () => {
      chrome.storage.local.get = vi.fn((keys: any, cb?: any) => {
        if (typeof cb === 'function') cb({ settings: DEFAULT_SETTINGS });
        else if (typeof keys === 'function') keys({ settings: DEFAULT_SETTINGS });
        return Promise.resolve({ settings: DEFAULT_SETTINGS });
      });
      chrome.storage.local.set = vi.fn((items: any, cb?: any) => {
        if (typeof cb === 'function') cb();
        else if (typeof items === 'function') items();
        return Promise.resolve();
      });

      const result = await updateSettings({ targetLang: 'fr' });
      expect(result.targetLang).toBe('fr');
      expect(result.sourceLang).toBe(DEFAULT_SETTINGS.sourceLang);
    });

    it('updates engine setting', async () => {
      chrome.storage.local.get = vi.fn((keys: any, cb?: any) => {
        if (typeof cb === 'function') cb({ settings: DEFAULT_SETTINGS });
        else if (typeof keys === 'function') keys({ settings: DEFAULT_SETTINGS });
        return Promise.resolve({ settings: DEFAULT_SETTINGS });
      });
      chrome.storage.local.set = vi.fn((items: any, cb?: any) => {
        if (typeof cb === 'function') cb();
        else if (typeof items === 'function') items();
        return Promise.resolve();
      });

      const result = await updateSettings({ engine: TranslationEngine.DEEPL });
      expect(result.engine).toBe(TranslationEngine.DEEPL);
    });
  });
});
