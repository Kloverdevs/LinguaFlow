import { sendToContent } from '@/shared/message-bus';
import { logger } from '@/shared/logger';

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    // Try sending a ping first; if it fails, inject the script
    await chrome.tabs.sendMessage(tabId, { type: '__PING__' });
  } catch {
    // Content script not loaded — inject it
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/index.js'],
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content/linguaflow.css'],
    });
  }
}

export function setupContextMenus(): void {
  chrome.contextMenus.create({
    id: 'translate-page',
    title: 'Translate Entire Page',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'translate-selection',
    title: 'Translate Selection',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'translate-image',
    title: 'Translate Image',
    contexts: ['image'],
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    try {
      await ensureContentScript(tab.id);

      if (info.menuItemId === 'translate-page') {
        await sendToContent(tab.id, { type: 'TRANSLATE_PAGE' });
      } else if (info.menuItemId === 'translate-selection' && info.selectionText) {
        await sendToContent(tab.id, {
          type: 'TRANSLATE_SELECTION',
          payload: { text: info.selectionText },
        });
      } else if (info.menuItemId === 'translate-image' && info.srcUrl) {
        await sendToContent(tab.id, {
          type: 'TRANSLATE_IMAGE',
          payload: { srcUrl: info.srcUrl },
        });
      }
    } catch (err) {
      logger.error('Context menu action failed:', err);
    }
  });
}
