import browser from 'webextension-polyfill';
import { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/constants/defaults';

export async function getSettings(): Promise<UserSettings> {
  const result = await browser.storage.local.get('settings');
  return (result.settings as UserSettings) ?? DEFAULT_SETTINGS;
}

export async function syncSettings(settings: UserSettings): Promise<void> {
  // Strip engineConfigs to avoid syncing API keys in plaintext
  const { engineConfigs, ...syncableSettings } = settings;
  await browser.storage.sync.set({ syncedSettings: syncableSettings });
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await browser.storage.local.set({ settings });
  
  if (settings.enableSync) {
    await syncSettings(settings).catch((err) => {
      console.warn('[LinguaFlow] Settings sync failed (quota exceeded?):', err?.message);
    });
  }
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
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
