import browser from 'webextension-polyfill';
import { MessageToBackground, MessageToContent, MessageResponse } from '@/types/messages';

/** Default timeout for message bus requests (30 seconds) */
const MESSAGE_TIMEOUT_MS = 30_000;

export async function sendToBackground<T = unknown>(
  message: MessageToBackground,
  timeoutMs = MESSAGE_TIMEOUT_MS
): Promise<MessageResponse<T>> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Message '${message.type}' timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  return Promise.race([browser.runtime.sendMessage(message), timeout]);
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
  const wrappedHandler = handler as Parameters<typeof browser.runtime.onMessage.addListener>[0];
  browser.runtime.onMessage.addListener(wrappedHandler);
  return () => browser.runtime.onMessage.removeListener(wrappedHandler);
}
