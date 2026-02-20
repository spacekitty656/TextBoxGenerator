import { describe, expect, it, vi } from 'vitest';

import { createImageLibraryStore } from '../../src/images/libraryStore.js';
import { IMAGE_LIBRARY_STORAGE_KEY, serializeImageLibraryForPersistence } from '../../src/images/libraryPersistence.js';
import {
  migrateLegacyImageLibraryToIndexedDb,
  persistImageLibraryToIndexedDb,
  restoreImageLibraryFromIndexedDb,
} from '../../src/images/libraryPersistenceIndexedDb.js';

function createFakeIndexedDb({ imagePutError = null } = {}) {
  const databases = new Map();

  function createDatabase(name) {
    if (!databases.has(name)) {
      databases.set(name, {
        stores: new Map(),
      });
    }

    const state = databases.get(name);

    function buildConnection() {
      const connection = {
        objectStoreNames: {
          contains(storeName) {
            return state.stores.has(storeName);
          },
        },
        createObjectStore(storeName) {
          if (!state.stores.has(storeName)) {
            state.stores.set(storeName, new Map());
          }

          return { name: storeName };
        },
        transaction(storeNames) {
          const names = Array.isArray(storeNames) ? storeNames : [storeNames];
          let pending = 0;
          let closed = false;
          const listeners = {
            oncomplete: null,
            onerror: null,
            onabort: null,
          };
          let abortedError = null;

          function scheduleComplete() {
            if (!closed && pending === 0 && typeof listeners.oncomplete === 'function') {
              closed = true;
              setTimeout(() => listeners.oncomplete(), 0);
            }
          }

          const transaction = {
            error: null,
            get oncomplete() {
              return listeners.oncomplete;
            },
            set oncomplete(handler) {
              listeners.oncomplete = handler;
              scheduleComplete();
            },
            get onerror() {
              return listeners.onerror;
            },
            set onerror(handler) {
              listeners.onerror = handler;
              if (abortedError && typeof handler === 'function') {
                setTimeout(() => handler(), 0);
              }
            },
            get onabort() {
              return listeners.onabort;
            },
            set onabort(handler) {
              listeners.onabort = handler;
              if (abortedError && typeof handler === 'function') {
                setTimeout(() => handler(), 0);
              }
            },
            objectStore(storeName) {
              if (!names.includes(storeName)) {
                throw new Error(`Store ${storeName} not in transaction.`);
              }

              if (!state.stores.has(storeName)) {
                state.stores.set(storeName, new Map());
              }

              const backingStore = state.stores.get(storeName);

              function makeRequest(action) {
                pending += 1;
                const request = {
                  onsuccess: null,
                  onerror: null,
                  result: undefined,
                  error: null,
                };

                setTimeout(() => {
                  try {
                    request.result = action();
                    request.onsuccess?.();
                  } catch (error) {
                    request.error = error;
                    request.onerror?.();
                    if (!closed) {
                      closed = true;
                      abortedError = error;
                      transaction.error = error;
                      listeners.onerror?.();
                      listeners.onabort?.();
                    }
                  } finally {
                    pending -= 1;
                    scheduleComplete();
                  }
                }, 0);

                return request;
              }

              return {
                put(value) {
                  return makeRequest(() => {
                    if (storeName === 'images' && imagePutError) {
                      throw imagePutError;
                    }

                    const key = storeName === 'images' ? value.blobId : value.id;
                    backingStore.set(key, value);
                    return key;
                  });
                },
                get(key) {
                  return makeRequest(() => backingStore.get(key));
                },
                delete(key) {
                  return makeRequest(() => backingStore.delete(key));
                },
                getAllKeys() {
                  return makeRequest(() => Array.from(backingStore.keys()));
                },
              };
            },
          };

          setTimeout(scheduleComplete, 0);
          return transaction;
        },
        close() {},
      };

      return connection;
    }

    return buildConnection();
  }

  return {
    open(name) {
      const request = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        result: null,
        error: null,
      };

      setTimeout(() => {
        try {
          const isNew = !databases.has(name);
          request.result = createDatabase(name);
          if (isNew) {
            request.onupgradeneeded?.();
          }
          request.onsuccess?.();
        } catch (error) {
          request.error = error;
          request.onerror?.();
        }
      }, 0);

      return request;
    },
  };
}

describe('indexeddb image library persistence', () => {
  it('round-trips image metadata and blobs', async () => {
    const indexedDb = createFakeIndexedDb();
    const store = createImageLibraryStore();
    const blob = new Blob(['hello'], { type: 'image/png' });

    const created = store.createImage({
      name: 'hero.png',
      blob,
      mimeType: 'image/png',
      byteSize: blob.size,
    });

    const persistStatus = await persistImageLibraryToIndexedDb(store, { indexedDb });
    expect(persistStatus).toMatchObject({ ok: true });

    const persistedImage = store.getImage(created.id);
    expect(persistedImage.blobId).toBeTruthy();

    const restored = await restoreImageLibraryFromIndexedDb({ indexedDb });
    expect(restored.images[0]).toMatchObject({
      id: created.id,
      name: 'hero.png',
      mimeType: 'image/png',
      byteSize: blob.size,
      blobId: persistedImage.blobId,
      storageKey: persistedImage.blobId,
    });
    expect(restored.images[0].blob).toBeInstanceOf(Blob);
  });

  it('returns quota-exceeded status when indexeddb writes fail with quota errors', async () => {
    const quotaError = new Error('Storage full.');
    quotaError.name = 'QuotaExceededError';

    const indexedDb = createFakeIndexedDb({ imagePutError: quotaError });
    const store = createImageLibraryStore();
    const blob = new Blob(['hello'], { type: 'image/png' });

    store.createImage({
      name: 'large.png',
      blob,
      mimeType: 'image/png',
      byteSize: blob.size,
    });

    const persistStatus = await persistImageLibraryToIndexedDb(store, { indexedDb });
    expect(persistStatus).toMatchObject({
      ok: false,
      reason: 'quota-exceeded',
      error: quotaError,
    });
  });

  it('migrates legacy localStorage payload into indexeddb and clears legacy key', async () => {
    const indexedDb = createFakeIndexedDb();
    const store = createImageLibraryStore();
    store.createImage({
      name: 'legacy.png',
      dataUrl: 'data:image/png;base64,Zm9v',
      mimeType: 'image/png',
    });

    const legacyPayload = JSON.stringify(serializeImageLibraryForPersistence(store));
    const storage = {
      getItem: vi.fn(() => legacyPayload),
      removeItem: vi.fn(),
    };

    const targetStore = createImageLibraryStore();
    const migrationResult = await migrateLegacyImageLibraryToIndexedDb(targetStore, {
      storage,
      storageKey: IMAGE_LIBRARY_STORAGE_KEY,
      indexedDb,
    });

    expect(migrationResult).toMatchObject({
      ok: true,
      library: expect.any(Object),
    });
    expect(storage.getItem).toHaveBeenCalledWith(IMAGE_LIBRARY_STORAGE_KEY);
    expect(storage.removeItem).toHaveBeenCalledWith(IMAGE_LIBRARY_STORAGE_KEY);

    const restored = await restoreImageLibraryFromIndexedDb({ indexedDb });
    expect(restored.images[0]).toMatchObject({
      name: 'legacy.png',
      dataUrl: 'data:image/png;base64,Zm9v',
      mimeType: 'image/png',
    });
  });
});
