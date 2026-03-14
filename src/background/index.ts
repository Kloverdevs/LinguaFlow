import browser from 'webextension-polyfill';
import { setupMessageHandler } from './message-handler';
import { setupContextMenus } from './context-menu';
import { setupKeyboardShortcuts } from './keyboard-shortcuts';
import { logger } from '@/shared/logger';

logger.info('Service worker starting');

setupMessageHandler();
setupKeyboardShortcuts();

// Set up context menus and onboarding when the extension is installed
browser.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed, setting up context menus');
  setupContextMenus();

  if (details.reason === 'install') {
    browser.tabs.create({ url: 'welcome/index.html' });
  }
});

// Debounce settings broadcast to avoid flooding tabs on rapid changes
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

// Broadcast settings changes to ALL tabs
browser.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'local' && changes.settings?.newValue) {
    if (broadcastTimer) clearTimeout(broadcastTimer);
    const newSettings = changes.settings.newValue;
    broadcastTimer = setTimeout(async () => {
      broadcastTimer = null;
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            payload: newSettings,
          }).catch(() => {
            // Tab may not have content script loaded — expected
          });
        }
      }
    }, 150);
  }

  // Handle incoming sync changes from other devices
  if (areaName === 'sync' && changes.syncedSettings?.newValue) {
    const result = await browser.storage.local.get('settings');
    const currentLocal = (result.settings as Record<string, any>) || {};

    // Merge the incoming settings, but strictly preserve the local API keys
    const newLocal = {
      ...currentLocal,
      ...changes.syncedSettings.newValue,
      engineConfigs: currentLocal.engineConfigs || {},
    };

    await browser.storage.local.set({ settings: newLocal });
  }
});

logger.info('Service worker ready');
