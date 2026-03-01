import browser from 'webextension-polyfill';
import { MessageToBackground, MessageToContent, MessageResponse } from '@/types/messages';

export async function sendToBackground<T = unknown>(
  message: MessageToBackground
): Promise<MessageResponse<T>> {
  return browser.runtime.sendMessage(message);
}

export async function sendToContent<T = unknown>(
  tabId: number,
  message: MessageToContent
): Promise<MessageResponse<T>> {
  return browser.tabs.sendMessage(tabId, message);
}

export async function sendToActiveTab<T = unknown>(
  message: MessageToContent
): Promise<MessageResponse<T>> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found');
  return sendToContent(tab.id, message);
}

export function onMessage(
  handler: (
    message: MessageToBackground | MessageToContent,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => boolean | void
): () => void {
  browser.runtime.onMessage.addListener(handler as any);
  return () => browser.runtime.onMessage.removeListener(handler as any);
}
