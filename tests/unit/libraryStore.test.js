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

  it('keeps image ids stable across rename, move, and reorder', () => {
    const store = createImageLibraryStore();
    const folderA = store.createFolder({ name: 'Folder A' });
    const folderB = store.createFolder({ name: 'Folder B' });
    const image = store.createImage({ name: 'frame.png', parentId: folderA.id });

    store.updateImage(image.id, { name: 'renamed-frame.png' });
    store.moveImage(image.id, { parentId: folderB.id, orderIndex: 0 });
    store.reorderImage(image.id, 0);

    expect(store.getImage(image.id)).toMatchObject({
      id: image.id,
      name: 'renamed-frame.png',
      parentId: folderB.id,
    });
  });

  it('supports folder rename and recursive delete semantics', () => {
    const store = createImageLibraryStore();
    const parent = store.createFolder({ name: 'Parent' });
    const child = store.createFolder({ name: 'Child', parentId: parent.id });
    const image = store.createImage({ name: 'nested.png', parentId: child.id });

    store.updateFolder(parent.id, { name: 'Renamed Parent' });
    expect(store.getFolder(parent.id)?.name).toBe('Renamed Parent');

    expect(store.deleteFolder(parent.id)).toBe(true);
    expect(store.getFolder(parent.id)).toBeNull();
    expect(store.getFolder(child.id)).toBeNull();
    expect(store.getImage(image.id)).toBeNull();
  });

  it('supports delete-folder strategy workflows via snapshot and restore', () => {
    const store = createImageLibraryStore();
    const parent = store.createFolder({ name: 'Parent' });
    const child = store.createFolder({ name: 'Child', parentId: parent.id });
    const image = store.createImage({ name: 'nested.png', parentId: parent.id });

    const snapshot = store.createSnapshot();

    // Delete strategy
    store.deleteFolder(parent.id);
    expect(store.getFolder(parent.id)).toBeNull();

    // Cancel strategy
    store.restoreSnapshot(snapshot);
    expect(store.getFolder(parent.id)).toBeTruthy();
    expect(store.getFolder(child.id)).toBeTruthy();
    expect(store.getImage(image.id)).toBeTruthy();
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
    expect(folderAChildren.images.map((imageEntry) => imageEntry.id)).toEqual([img2.id, img1.id]);
    expect(restored.getImage(img1.id)).toMatchObject({
      dataUrl: 'data:image/png;base64,AAA',
      mimeType: 'image/png',
    });
  });
});
