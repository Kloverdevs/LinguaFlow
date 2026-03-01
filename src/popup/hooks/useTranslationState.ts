import browser from 'webextension-polyfill';
import { useState, useCallback } from 'react';

export type TranslationStatus = 'idle' | 'translating' | 'done' | 'error';

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
    await new Promise((r) => setTimeout(r, 200));
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
      console.error('[LinguaFlow] Toggle failed:', err);
      setStatus('error');
      // Reset after brief delay so user can try again
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [isActive]);

  return { isActive, status, toggle };
}
