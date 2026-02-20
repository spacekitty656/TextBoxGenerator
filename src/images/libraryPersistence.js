export const IMAGE_LIBRARY_STORAGE_KEY = 'textbox-generator:image-library';

export const IMAGE_LIBRARY_BINARY_ENCODING = 'data-url';

export function serializeImageLibraryForPersistence(store) {
  return {
    version: 1,
    binaryEncoding: IMAGE_LIBRARY_BINARY_ENCODING,
    library: store.serialize(),
  };
}

export function persistImageLibrary(storage, store, storageKey = IMAGE_LIBRARY_STORAGE_KEY) {
  if (!storage || typeof storage.setItem !== 'function' || !store) {
    return false;
  }

  const payload = serializeImageLibraryForPersistence(store);
  storage.setItem(storageKey, JSON.stringify(payload));
  return true;
}

export function restoreImageLibrarySnapshot(storage, storageKey = IMAGE_LIBRARY_STORAGE_KEY) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  const raw = storage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.binaryEncoding !== IMAGE_LIBRARY_BINARY_ENCODING) {
      return null;
    }

    return parsed?.library || null;
  } catch (error) {
    console.warn('Unable to parse image library persistence payload.', error);
    return null;
  }
}
