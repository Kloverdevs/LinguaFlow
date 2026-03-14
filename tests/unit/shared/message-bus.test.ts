import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock webextension-polyfill before importing message-bus
vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      sendMessage: vi.fn(),
      query: vi.fn(),
    },
  },
}));

import browser from 'webextension-polyfill';
import { sendToBackground, sendToContent, sendToActiveTab } from '@/shared/message-bus';

describe('message-bus', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendToBackground', () => {
    it('sends message via browser.runtime.sendMessage', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValue({ success: true, data: null });

      const result = await sendToBackground({ type: 'GET_SETTINGS' });
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GET_SETTINGS',
      });
      expect(result).toEqual({ success: true, data: null });
    });

    it('sends translate request with payload', async () => {
      vi.mocked(browser.runtime.sendMessage).mockResolvedValue({
        success: true,
        data: { translatedTexts: ['Hola'] },
      });

      const result = await sendToBackground({
        type: 'TRANSLATE_REQUEST',
        payload: { texts: ['Hello'], sourceLang: 'en', targetLang: 'es' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendToContent', () => {
    it('sends message via browser.tabs.sendMessage', async () => {
      vi.mocked(browser.tabs.sendMessage).mockResolvedValue({ success: true, data: null });

      await sendToContent(42, { type: 'TRANSLATE_PAGE' });
      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(42, {
        type: 'TRANSLATE_PAGE',
      });
    });
  });

  describe('sendToActiveTab', () => {
    it('queries active tab and sends message', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([{ id: 99 }] as any);
      vi.mocked(browser.tabs.sendMessage).mockResolvedValue({ success: true, data: null });

      await sendToActiveTab({ type: 'TOGGLE_TRANSLATION' });
      expect(browser.tabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(99, {
        type: 'TOGGLE_TRANSLATION',
      });
    });

    it('throws when no active tab found', async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([]);

      await expect(
        sendToActiveTab({ type: 'TOGGLE_TRANSLATION' })
      ).rejects.toThrow('No active tab found');
    });
  });
});
