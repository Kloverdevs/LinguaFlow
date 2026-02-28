import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/constants/defaults';

export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings | null>(null);

  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      setSettingsState(result.settings ?? DEFAULT_SETTINGS);
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.settings) {
        setSettingsState(changes.settings.newValue as UserSettings);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      chrome.storage.local.set({ settings: next });
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
