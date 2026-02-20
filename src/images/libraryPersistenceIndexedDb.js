import { IMAGE_LIBRARY_STORAGE_KEY, restoreImageLibrarySnapshot } from './libraryPersistence.js';

const DB_NAME = 'textbox-generator-image-library';
const DB_VERSION = 1;
const LIBRARY_STORE = 'library';
const IMAGE_BLOB_STORE = 'images';
const LIBRARY_RECORD_ID = 'snapshot';

function openDatabase(indexedDb = window.indexedDB) {
  if (!indexedDb || typeof indexedDb.open !== 'function') {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(LIBRARY_STORE)) {
        database.createObjectStore(LIBRARY_STORE, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(IMAGE_BLOB_STORE)) {
        database.createObjectStore(IMAGE_BLOB_STORE, { keyPath: 'blobId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open IndexedDB.'));
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
  });
}

function createBlobId(imageId) {
  return `blob:${imageId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

export async function persistImageLibraryToIndexedDb(store, { indexedDb = window.indexedDB } = {}) {
  if (!store) {
    return false;
  }

  const database = await openDatabase(indexedDb);
  if (!database) {
    return false;
  }

  try {
    const images = store.listAllImages();
    const activeBlobIds = new Set();
    const now = Date.now();

    const writeTransaction = database.transaction([LIBRARY_STORE, IMAGE_BLOB_STORE], 'readwrite');
    const libraryStore = writeTransaction.objectStore(LIBRARY_STORE);
    const imageStore = writeTransaction.objectStore(IMAGE_BLOB_STORE);

    for (const imageEntry of images) {
      if (!(imageEntry.blob instanceof Blob)) {
        continue;
      }

      const blobId = imageEntry.blobId || imageEntry.storageKey || createBlobId(imageEntry.id);
      activeBlobIds.add(blobId);

      imageStore.put({
        blobId,
        blob: imageEntry.blob,
        mimeType: imageEntry.mimeType || imageEntry.blob.type || null,
        byteSize: Number.isFinite(imageEntry.byteSize) ? imageEntry.byteSize : imageEntry.blob.size,
        updatedAt: now,
      });

      store.updateImage(imageEntry.id, {
        blobId,
        storageKey: blobId,
        byteSize: imageEntry.blob.size,
        mimeType: imageEntry.mimeType || imageEntry.blob.type || null,
      });
    }

    const existingBlobRecords = await requestToPromise(imageStore.getAllKeys());
    existingBlobRecords
      .filter((blobId) => !activeBlobIds.has(blobId))
      .forEach((blobId) => imageStore.delete(blobId));

    libraryStore.put({
      id: LIBRARY_RECORD_ID,
      library: store.serialize(),
      updatedAt: now,
    });

    await transactionDone(writeTransaction);
    return true;
  } finally {
    database.close();
  }
}

export async function restoreImageLibraryFromIndexedDb({ indexedDb = window.indexedDB } = {}) {
  const database = await openDatabase(indexedDb);
  if (!database) {
    return null;
  }

  try {
    const transaction = database.transaction([LIBRARY_STORE, IMAGE_BLOB_STORE], 'readonly');
    const libraryStore = transaction.objectStore(LIBRARY_STORE);
    const imageStore = transaction.objectStore(IMAGE_BLOB_STORE);

    const libraryRecord = await requestToPromise(libraryStore.get(LIBRARY_RECORD_ID));
    if (!libraryRecord?.library) {
      return null;
    }

    const library = {
      ...libraryRecord.library,
      images: Array.isArray(libraryRecord.library.images)
        ? libraryRecord.library.images.map((imageEntry) => ({ ...imageEntry }))
        : [],
    };

    await Promise.all(library.images.map(async (imageEntry) => {
      const blobId = imageEntry.blobId || imageEntry.storageKey;
      if (!blobId) {
        return;
      }

      const blobRecord = await requestToPromise(imageStore.get(blobId));
      if (!blobRecord?.blob) {
        return;
      }

      imageEntry.blob = blobRecord.blob;
      imageEntry.mimeType = imageEntry.mimeType || blobRecord.mimeType || blobRecord.blob.type || null;
      imageEntry.byteSize = Number.isFinite(imageEntry.byteSize)
        ? imageEntry.byteSize
        : (Number.isFinite(blobRecord.byteSize) ? blobRecord.byteSize : blobRecord.blob.size);
      imageEntry.blobId = blobId;
      imageEntry.storageKey = blobId;
    }));

    return library;
  } finally {
    database.close();
  }
}

export async function migrateLegacyImageLibraryToIndexedDb(store, {
  storage = window.localStorage,
  storageKey = IMAGE_LIBRARY_STORAGE_KEY,
  indexedDb = window.indexedDB,
} = {}) {
  const legacyLibrary = restoreImageLibrarySnapshot(storage, storageKey);

  if (!legacyLibrary) {
    return null;
  }

  store.deserialize(legacyLibrary);
  await persistImageLibraryToIndexedDb(store, { indexedDb });

  if (storage && typeof storage.removeItem === 'function') {
    storage.removeItem(storageKey);
  }

  return legacyLibrary;
}

export const imageLibraryIndexedDbConfig = {
  databaseName: DB_NAME,
  version: DB_VERSION,
  stores: {
    library: LIBRARY_STORE,
    images: IMAGE_BLOB_STORE,
  },
};
