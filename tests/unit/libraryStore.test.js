import { describe, expect, it } from 'vitest';

import { createLibraryStore } from '../../src/images/libraryStore.js';

describe('libraryStore', () => {
  it('keeps IDs stable across move and rename operations', () => {
    const store = createLibraryStore();
    const folderA = store.createFolder('root', 'A');
    const folderB = store.createFolder('root', 'B');
    const image = store.createImage(folderA.id, 'Piece', 'asset-1');

    store.renameNode(image.id, 'Piece Renamed');
    store.moveNode(image.id, folderB.id);

    const moved = store.findNode(image.id);
    expect(moved.id).toBe(image.id);
    expect(moved.name).toBe('Piece Renamed');
    expect(store.findNode(folderA.id).children).toHaveLength(0);
    expect(store.findNode(folderB.id).children.map((node) => node.id)).toContain(image.id);
  });

  it('supports folder deletion modes (delete-all and promote-children)', () => {
    const store = createLibraryStore();
    const parent = store.createFolder('root', 'Parent');
    const removable = store.createFolder(parent.id, 'Removable');
    const nestedImage = store.createImage(removable.id, 'Nested', 'asset-nested');

    store.deleteNode(removable.id, 'promote-children');
    expect(store.findNode(nestedImage.id)).toBeTruthy();
    expect(store.findNode(parent.id).children.map((node) => node.id)).toContain(nestedImage.id);

    const removable2 = store.createFolder(parent.id, 'Removable 2');
    const nestedImage2 = store.createImage(removable2.id, 'Nested 2', 'asset-nested-2');

    store.deleteNode(removable2.id, 'delete-all');
    expect(store.findNode(removable2.id)).toBeNull();
    expect(store.findNode(nestedImage2.id)).toBeNull();
  });
});
