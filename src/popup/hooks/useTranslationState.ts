import browser from 'webextension-polyfill';
import { useState, useCallback } from 'react';
import { logger } from '@/shared/logger';

export type TranslationStatus = 'idle' | 'translating' | 'done' | 'error';

/** Delay for content script to initialize after injection */
const SCRIPT_INIT_MS = 200;
/** Delay before resetting error status back to idle */
const ERROR_RESET_MS = 2000;

async function sendToTab(message: { type: string }): Promise<unknown> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab');

  // Try sending message first; if content script isn't loaded, inject it
  try {
    return await browser.tabs.sendMessage(tab.id, message);
  } catch {
    // Content script not loaded — inject it
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/index.js'],
    });
    await browser.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content/linguaflow.css'],
    });
    // Small delay for script init
    await new Promise((r) => setTimeout(r, SCRIPT_INIT_MS));
    return browser.tabs.sendMessage(tab.id, message);
  }
}

export function useTranslationState() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<TranslationStatus>('idle');

  const toggle = useCallback(async () => {
    try {
      if (isActive) {
        await sendToTab({ type: 'REMOVE_TRANSLATIONS' });
        setIsActive(false);
        setStatus('idle');
      } else {
        setStatus('translating');
        await sendToTab({ type: 'TRANSLATE_PAGE' });
        setIsActive(true);
        setStatus('done');
      }
    } catch (err) {
      logger.error('Toggle failed:', err);
      setStatus('error');
      // Reset after brief delay so user can try again
      setTimeout(() => setStatus('idle'), ERROR_RESET_MS);
    }
  }, [isActive]);

  return { isActive, status, toggle };
}
