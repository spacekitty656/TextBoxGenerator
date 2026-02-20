import { describe, expect, it } from 'vitest';

import { createImageLibraryStore } from '../../src/images/libraryStore.js';

describe('image library store', () => {
  it('creates a non-deletable root folder named All Images', () => {
    const store = createImageLibraryStore();

    const root = store.getRootFolder();
    expect(root).toMatchObject({
      id: store.ROOT_FOLDER_ID,
      name: 'All Images',
      nonDeletable: true,
      parentId: null,
    });
    expect(store.deleteFolder(root.id)).toBe(false);
  });

  it('supports CRUD/move/reorder while preserving stable image ids', () => {
    const store = createImageLibraryStore();
    const folderA = store.createFolder({ name: 'Folder A' });
    const folderB = store.createFolder({ name: 'Folder B' });
    const image = store.createImage({ name: 'frame.png', parentId: folderA.id });

    const slotReference = { imageId: image.id, rotation: 90, flipX: true, flipY: false };

    store.updateImage(image.id, { name: 'renamed-frame.png' });
    store.moveImage(image.id, { parentId: folderB.id, orderIndex: 0 });
    store.reorderImage(image.id, 0);

    const referencedImage = store.getImage(slotReference.imageId);
    expect(referencedImage).toBeTruthy();
    expect(referencedImage.id).toBe(image.id);
    expect(referencedImage.name).toBe('renamed-frame.png');
    expect(referencedImage.parentId).toBe(folderB.id);
  });

  it('serializes and deserializes hierarchy with ordering', () => {
    const store = createImageLibraryStore();
    const folderA = store.createFolder({ name: 'A' });
    const folderB = store.createFolder({ name: 'B', orderIndex: 0 });

    const img1 = store.createImage({ name: 'one.png', parentId: folderA.id, dataUrl: 'data:image/png;base64,AAA', mimeType: 'image/png' });
    const img2 = store.createImage({ name: 'two.png', parentId: folderA.id, orderIndex: 0 });

    const serialized = store.serialize();
    const restored = createImageLibraryStore(serialized);

    const rootChildren = restored.listChildren(restored.ROOT_FOLDER_ID);
    expect(rootChildren.folders.map((folder) => folder.id)).toEqual([folderB.id, folderA.id]);

    const folderAChildren = restored.listChildren(folderA.id);
    expect(folderAChildren.images.map((image) => image.id)).toEqual([img2.id, img1.id]);
    expect(restored.getImage(img1.id)).toMatchObject({
      dataUrl: 'data:image/png;base64,AAA',
      mimeType: 'image/png',
    });
  });
});
