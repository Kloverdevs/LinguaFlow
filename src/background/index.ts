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

logger.info('Service worker ready');
