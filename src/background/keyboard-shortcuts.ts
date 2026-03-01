import browser from 'webextension-polyfill';
import { sendToContent } from '@/shared/message-bus';

export function setupKeyboardShortcuts(): void {
  browser.commands.onCommand.addListener(async (command) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    switch (command) {
      case 'toggle-translation':
        sendToContent(tab.id, { type: 'TOGGLE_TRANSLATION' }).catch(() => {});
        break;
      case 'toggle-hover-mode':
        sendToContent(tab.id, { type: 'TOGGLE_HOVER_MODE' }).catch(() => {});
        break;
      case 'toggle-selection-mode':
        sendToContent(tab.id, { type: 'TRANSLATE_CURRENT_SELECTION' }).catch(() => {});
        break;
    }
  });
}
