export const FONT_LIBRARY_STORAGE_KEY = 'textbox-generator:font-library';

export function persistFontLibrary(storage, store, storageKey = FONT_LIBRARY_STORAGE_KEY) {
  if (!storage || !store || typeof store.serialize !== 'function') {
    return;
  }

  const payload = {
    version: 1,
    library: store.serialize(),
  };

  storage.setItem(storageKey, JSON.stringify(payload));
}

export function restoreFontLibrary(storage, store, storageKey = FONT_LIBRARY_STORAGE_KEY) {
  if (!storage || !store || typeof store.deserialize !== 'function') {
    return false;
  }

  const raw = storage.getItem(storageKey);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.library) {
      return false;
    }

    store.deserialize(parsed.library);
    return true;
  } catch (error) {
    console.warn('Unable to parse font library payload.', error);
    return false;
  }
}
