import { describe, expect, it } from 'vitest';

import { createFontLibraryStore } from '../../src/fonts/fontLibraryStore.js';
import { persistFontLibraryToIndexedDb, restoreFontLibraryFromIndexedDb } from '../../src/fonts/fontPersistenceIndexedDb.js';

function createFakeIndexedDb() {
  const databases = new Map();

  function createDatabase(name) {
    if (!databases.has(name)) {
      databases.set(name, { stores: new Map() });
    }

    const state = databases.get(name);

    return {
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
        const listeners = { oncomplete: null, onerror: null, onabort: null };

        function tryComplete() {
          if (pending === 0 && typeof listeners.oncomplete === 'function') {
            setTimeout(() => listeners.oncomplete(), 0);
          }
        }

        const transaction = {
          error: null,
          get oncomplete() { return listeners.oncomplete; },
          set oncomplete(handler) { listeners.oncomplete = handler; tryComplete(); },
          get onerror() { return listeners.onerror; },
          set onerror(handler) { listeners.onerror = handler; },
          get onabort() { return listeners.onabort; },
          set onabort(handler) { listeners.onabort = handler; },
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
              const request = { onsuccess: null, onerror: null, result: undefined, error: null };

              setTimeout(() => {
                try {
                  request.result = action();
                  request.onsuccess?.();
                } catch (error) {
                  request.error = error;
                  request.onerror?.();
                } finally {
                  pending -= 1;
                  tryComplete();
                }
              }, 0);

              return request;
            }

            return {
              put(value) {
                return makeRequest(() => {
                  backingStore.set(value.id, value);
                  return value.id;
                });
              },
              get(key) {
                return makeRequest(() => backingStore.get(key));
              },
            };
          },
        };

        setTimeout(tryComplete, 0);
        return transaction;
      },
      close() {},
    };
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

describe('indexeddb font library persistence', () => {
  it('persists and restores imported font entries', async () => {
    const indexedDb = createFakeIndexedDb();
    const store = createFontLibraryStore();

    store.createFont({
      name: 'My Font',
      parentId: store.ROOT_FOLDER_ID,
      data: {
        value: 'my-font',
        family: '"My Font", sans-serif',
        familyName: 'My Font',
        sourceBlob: new Blob(['font-bytes'], { type: 'font/ttf' }),
      },
    });

    const persistStatus = await persistFontLibraryToIndexedDb(store, { indexedDb });
    expect(persistStatus).toMatchObject({ ok: true });

    const restored = await restoreFontLibraryFromIndexedDb({ indexedDb });
    const imported = restored.fonts.find((entry) => entry.name === 'My Font');

    expect(imported).toBeTruthy();
    expect(imported.data).toMatchObject({
      value: 'my-font',
      familyName: 'My Font',
    });
    expect(imported.data.sourceBlob).toBeInstanceOf(Blob);
  });
});
