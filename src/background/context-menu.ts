import { sendToContent } from '@/shared/message-bus';

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

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;

    if (info.menuItemId === 'translate-page') {
      sendToContent(tab.id, { type: 'TRANSLATE_PAGE' }).catch(() => {});
    } else if (info.menuItemId === 'translate-selection' && info.selectionText) {
      sendToContent(tab.id, {
        type: 'TRANSLATE_SELECTION',
        payload: { text: info.selectionText },
      }).catch(() => {});
    }
  });
}
