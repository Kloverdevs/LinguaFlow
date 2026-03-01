import browser from 'webextension-polyfill';
import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/constants/defaults';

export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings | null>(null);

  useEffect(() => {
    browser.storage.local.get('settings').then((result) => {
      setSettingsState((result.settings as UserSettings) ?? DEFAULT_SETTINGS);
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.settings) {
        setSettingsState(changes.settings.newValue as UserSettings);
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      browser.storage.local.set({ settings: next });
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
