import { setupMessageHandler } from './message-handler';
import { setupContextMenus } from './context-menu';
import { setupKeyboardShortcuts } from './keyboard-shortcuts';
import { logger } from '@/shared/logger';

logger.info('Service worker starting');

setupMessageHandler();
setupKeyboardShortcuts();

// Set up context menus when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  logger.info('Extension installed, setting up context menus');
  setupContextMenus();
});

// Broadcast settings changes to ALL tabs instantly
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings?.newValue) {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            payload: changes.settings!.newValue,
          }).catch(() => {
            // Tab may not have content script loaded — ignore
          });
        }
      }
    });
  }

  // Handle incoming sync changes from other devices
  if (areaName === 'sync' && changes.syncedSettings?.newValue) {
    chrome.storage.local.get('settings', (result) => {
      const currentLocal = result.settings || {};
      
      // Merge the incoming settings, but strictly preserve the local API keys
      const newLocal = {
        ...currentLocal,
        ...changes.syncedSettings.newValue,
        engineConfigs: currentLocal.engineConfigs || {},
      };
      
      chrome.storage.local.set({ settings: newLocal });
    });
  }
});

logger.info('Service worker ready');
