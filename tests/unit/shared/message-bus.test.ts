import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendToBackground, sendToContent, sendToActiveTab } from '@/shared/message-bus';

describe('message-bus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendToBackground', () => {
    it('sends message via chrome.runtime.sendMessage', async () => {
      chrome.runtime.sendMessage = vi.fn(() =>
        Promise.resolve({ success: true, data: null })
      );

      const result = await sendToBackground({ type: 'GET_SETTINGS' });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SETTINGS',
      });
      expect(result).toEqual({ success: true, data: null });
    });

    it('sends translate request with payload', async () => {
      chrome.runtime.sendMessage = vi.fn(() =>
        Promise.resolve({
          success: true,
          data: { translatedTexts: ['Hola'] },
        })
      );

      const result = await sendToBackground({
        type: 'TRANSLATE_REQUEST',
        payload: { texts: ['Hello'], sourceLang: 'en', targetLang: 'es' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendToContent', () => {
    it('sends message via chrome.tabs.sendMessage', async () => {
      chrome.tabs.sendMessage = vi.fn(() =>
        Promise.resolve({ success: true, data: null })
      );

      await sendToContent(42, { type: 'TRANSLATE_PAGE' });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, {
        type: 'TRANSLATE_PAGE',
      });
    });
  });

  describe('sendToActiveTab', () => {
    it('queries active tab and sends message', async () => {
      chrome.tabs.query = vi.fn(() =>
        Promise.resolve([{ id: 99 }])
      );
      chrome.tabs.sendMessage = vi.fn(() =>
        Promise.resolve({ success: true, data: null })
      );

      await sendToActiveTab({ type: 'TOGGLE_TRANSLATION' });
      expect(chrome.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(99, {
        type: 'TOGGLE_TRANSLATION',
      });
    });

    it('throws when no active tab found', async () => {
      chrome.tabs.query = vi.fn(() => Promise.resolve([]));

      await expect(
        sendToActiveTab({ type: 'TOGGLE_TRANSLATION' })
      ).rejects.toThrow('No active tab found');
    });
  });
});
