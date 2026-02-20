import { describe, expect, it, vi } from 'vitest';

import { createImageLibraryStore } from '../../src/images/libraryStore.js';
import {
  IMAGE_LIBRARY_BINARY_ENCODING,
  persistImageLibrary,
  restoreImageLibrarySnapshot,
  serializeImageLibraryForPersistence,
} from '../../src/images/libraryPersistence.js';

describe('image library persistence', () => {
  it('serializes with an explicit binary encoding strategy', () => {
    const store = createImageLibraryStore();
    store.createImage({
      name: 'sprite.png',
      dataUrl: 'data:image/png;base64,Zm9v',
      mimeType: 'image/png',
    });

    const serialized = serializeImageLibraryForPersistence(store);

    expect(serialized.binaryEncoding).toBe(IMAGE_LIBRARY_BINARY_ENCODING);
    expect(serialized.library.images[0]).toMatchObject({
      dataUrl: 'data:image/png;base64,Zm9v',
      mimeType: 'image/png',
    });
  });

  it('round-trips persisted payloads without losing ids, ordering, or metadata', () => {
    const store = createImageLibraryStore();
    const folder = store.createFolder({ name: 'Tiles' });
    store.createImage({
      name: 'a.png',
      parentId: folder.id,
      dataUrl: 'data:image/png;base64,AAA',
      mimeType: 'image/png',
      byteSize: 123,
      blobId: 'blob-a',
    });
    store.createImage({ name: 'b.png', parentId: folder.id, orderIndex: 0 });

    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    persistImageLibrary(storage, store, 'custom-key');
    storage.getItem.mockReturnValue(storage.setItem.mock.calls[0][1]);

    const restoredSnapshot = restoreImageLibrarySnapshot(storage, 'custom-key');
    const restoredStore = createImageLibraryStore(restoredSnapshot);

    const originalChildren = store.listChildren(folder.id);
    const restoredFolder = restoredStore.serialize().folders.find((entry) => entry.name === 'Tiles');
    const restoredChildren = restoredStore.listChildren(restoredFolder.id);

    expect(restoredChildren.images.map((entry) => entry.name)).toEqual(
      originalChildren.images.map((entry) => entry.name),
    );
    expect(restoredChildren.images[1]).toMatchObject({
      dataUrl: 'data:image/png;base64,AAA',
      mimeType: 'image/png',
      blobId: 'blob-a',
      storageKey: 'blob-a',
      byteSize: 123,
    });
  });
});
