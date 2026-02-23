import { IMAGE_LIBRARY_STORAGE_KEY } from './libraryPersistence.js';
import {
  migrateLegacyImageLibraryToIndexedDb,
  persistImageLibraryToIndexedDb,
  restoreImageLibraryFromIndexedDb,
} from './libraryPersistenceIndexedDb.js';

function loadImageFromSourceUrl(sourceUrl) {
  return new Promise((resolve, reject) => {
    const imageElement = new Image();
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error('Unable to load image.'));
    imageElement.src = sourceUrl;
  });
}

async function toDrawableImageFromBlob(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch (error) {
      // Fall back to <img> based loading.
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImageFromSourceUrl(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function restoreImageLibraryContentFromPersistence(store) {
  const images = store.listAllImages();

  await Promise.all(images.map(async (entry) => {
    if (!entry.blob && !entry.dataUrl) {
      return;
    }

    try {
      const restoredImage = entry.blob
        ? await toDrawableImageFromBlob(entry.blob)
        : await loadImageFromSourceUrl(entry.dataUrl);
      store.updateImage(entry.id, { image: restoredImage });
    } catch (error) {
      console.warn('Unable to restore persisted image content.', error);
    }
  }));
}

async function initializeImageLibrary(store, {
  storage = window.localStorage,
  storageKey = IMAGE_LIBRARY_STORAGE_KEY,
} = {}) {
  try {
    const indexedDbLibrary = await restoreImageLibraryFromIndexedDb();
    if (indexedDbLibrary) {
      store.deserialize(indexedDbLibrary);
      return { ok: true };
    }

    const migrationStatus = await migrateLegacyImageLibraryToIndexedDb(store, {
      storage,
      storageKey,
    });

    return migrationStatus || { ok: true };
  } catch (error) {
    console.warn('Unable to initialize image library persistence.', error);
    return {
      ok: false,
      reason: 'unknown',
      error,
    };
  }
}

function createPersistHandler(setStorageStatusMessage) {
  return async function persist(store) {
    try {
      const status = await persistImageLibraryToIndexedDb(store);

      if (status?.ok) {
        setStorageStatusMessage('');
        return status;
      }

      if (status?.reason === 'quota-exceeded') {
        setStorageStatusMessage('Image library storage is full. Delete images or folders to free space.', true);
        return status;
      }

      setStorageStatusMessage('');
      if (status?.error) {
        console.warn('Unable to persist image library to IndexedDB.', status.error);
      }

      return status;
    } catch (error) {
      setStorageStatusMessage('');
      console.warn('Unable to persist image library to IndexedDB.', error);
      return {
        ok: false,
        reason: 'unknown',
        error,
      };
    }
  };
}

async function loadImageFromFile(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  const image = await toDrawableImageFromBlob(file);

  return {
    image,
    blob: file,
    byteSize: file.size,
    mimeType: file.type || null,
  };
}

export function createImageLibraryService({
  setStorageStatusMessage = () => {},
} = {}) {
  return {
    restoreImageLibraryFromIndexedDb,
    migrateLegacyImageLibraryToIndexedDb,
    persistImageLibraryToIndexedDb,
    toDrawableImageFromBlob,
    loadImageFromSourceUrl,
    init: (store) => initializeImageLibrary(store),
    persist: createPersistHandler(setStorageStatusMessage),
    hydrateImages: (store) => restoreImageLibraryContentFromPersistence(store),
    loadFile: (file) => loadImageFromFile(file),
  };
}

export {
  loadImageFromSourceUrl,
  toDrawableImageFromBlob,
  loadImageFromFile,
  restoreImageLibraryContentFromPersistence,
  initializeImageLibrary,
};
