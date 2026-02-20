import { describe, expect, it, vi } from 'vitest';

import { createImageLibraryStore } from '../../src/images/libraryStore.js';
import { IMAGE_LIBRARY_STORAGE_KEY, serializeImageLibraryForPersistence } from '../../src/images/libraryPersistence.js';
import {
  migrateLegacyImageLibraryToIndexedDb,
  persistImageLibraryToIndexedDb,
  restoreImageLibraryFromIndexedDb,
} from '../../src/images/libraryPersistenceIndexedDb.js';

function createFakeIndexedDb() {
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

          function scheduleComplete() {
            if (!closed && pending === 0 && typeof listeners.oncomplete === 'function') {
              closed = true;
              setTimeout(() => listeners.oncomplete(), 0);
            }
          }

          const transaction = {
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
            },
            get onabort() {
              return listeners.onabort;
            },
            set onabort(handler) {
              listeners.onabort = handler;
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
                    listeners.onerror?.();
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

    const didPersist = await persistImageLibraryToIndexedDb(store, { indexedDb });
    expect(didPersist).toBe(true);

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
    await migrateLegacyImageLibraryToIndexedDb(targetStore, {
      storage,
      storageKey: IMAGE_LIBRARY_STORAGE_KEY,
      indexedDb,
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
