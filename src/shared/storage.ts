import { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/constants/defaults';

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get('settings');
  return result.settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await saveSettings(updated);
  return updated;
}

export function onSettingsChanged(
  callback: (newSettings: UserSettings, oldSettings: UserSettings) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes.settings) {
      callback(
        changes.settings.newValue as UserSettings,
        changes.settings.oldValue as UserSettings
      );
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
