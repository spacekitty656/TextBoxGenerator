export const DEFAULT_SETTINGS_STORAGE_KEY = 'text-box-generator-settings';

export function openSettingsWindow(settingsOverlay) {
  if (!settingsOverlay) {
    return;
  }

  settingsOverlay.classList.remove('hidden');
  settingsOverlay.setAttribute('aria-hidden', 'false');
}

export function closeSettingsWindow(settingsOverlay) {
  if (!settingsOverlay) {
    return;
  }

  settingsOverlay.classList.add('hidden');
  settingsOverlay.setAttribute('aria-hidden', 'true');
}

export function getSavedSettings(storage, storageKey = DEFAULT_SETTINGS_STORAGE_KEY) {
  try {
    const rawSettings = storage.getItem(storageKey);
    if (!rawSettings) {
      return {};
    }

    const parsedSettings = JSON.parse(rawSettings);
    if (!parsedSettings || typeof parsedSettings !== 'object') {
      return {};
    }

    return parsedSettings;
  } catch {
    return {};
  }
}

export function persistSettings(storage, settingsPayload, storageKey = DEFAULT_SETTINGS_STORAGE_KEY) {
  try {
    storage.setItem(storageKey, JSON.stringify(settingsPayload));
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
}

export function applySavedSettings({ storage, darkModeToggle, applyDarkMode, storageKey = DEFAULT_SETTINGS_STORAGE_KEY }) {
  if (!darkModeToggle) {
    return;
  }

  const savedSettings = getSavedSettings(storage, storageKey);
  darkModeToggle.checked = Boolean(savedSettings.darkMode);
  applyDarkMode(darkModeToggle.checked);
}
