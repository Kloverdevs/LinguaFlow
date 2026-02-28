import { sendToContent } from '@/shared/message-bus';

export function setupKeyboardShortcuts(): void {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-translation') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        sendToContent(tab.id, { type: 'TOGGLE_TRANSLATION' }).catch(() => {});
      }
    }
  });
}
