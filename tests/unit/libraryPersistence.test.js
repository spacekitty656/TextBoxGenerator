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

  it('persists to storage and restores snapshot payload', () => {
    const store = createImageLibraryStore();
    store.createFolder({ name: 'Tiles' });

    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };

    persistImageLibrary(storage, store, 'custom-key');

    expect(storage.setItem).toHaveBeenCalledOnce();
    expect(storage.setItem.mock.calls[0][0]).toBe('custom-key');

    storage.getItem.mockReturnValue(storage.setItem.mock.calls[0][1]);
    const restored = restoreImageLibrarySnapshot(storage, 'custom-key');
    expect(restored).toMatchObject({
      folders: expect.arrayContaining([
        expect.objectContaining({ name: 'Tiles' }),
      ]),
    });
  });
});
