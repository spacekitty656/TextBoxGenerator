import { describe, expect, it, vi } from 'vitest';

import { createManageImagesWindowController } from '../../src/ui/manageImagesWindow.js';

function setupController() {
  document.body.innerHTML = `
    <div id="pane"><div id="tree"></div></div>
    <button id="import"></button>
    <button id="create-folder"></button>
    <button id="refresh"></button>
    <button id="rename"></button>
    <button id="delete"></button>
    <div id="image-menu" class="hidden">
      <button data-action="refresh">🗘 Refresh from computer</button>
      <button data-action="rename">📝 Rename</button>
      <button data-action="delete">Delete</button>
    </div>
    <div id="folder-menu" class="hidden">
      <button data-action="rename">📝 Rename</button>
      <button data-action="delete">Delete</button>
    </div>
  `;

  const callbacks = {
    onRefresh: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onMove: vi.fn(),
    onFolderToggle: vi.fn(),
  };

  const controller = createManageImagesWindowController({
    treePane: document.getElementById('pane'),
    treeRoot: document.getElementById('tree'),
    toolbar: {
      importImage: document.getElementById('import'),
      createFolder: document.getElementById('create-folder'),
      refresh: document.getElementById('refresh'),
      rename: document.getElementById('rename'),
      delete: document.getElementById('delete'),
    },
    contextMenus: {
      image: document.getElementById('image-menu'),
      folder: document.getElementById('folder-menu'),
    },
    ...callbacks,
  });

  controller.setTreeData({
    rootId: 'all-images',
    nodes: [
      { id: 'all-images', type: 'folder', name: 'All Images', expanded: true, childrenIds: ['folder-a', 'image-a', 'image-b'] },
      { id: 'folder-a', type: 'folder', name: 'Folder A', expanded: true, parentId: 'all-images', childrenIds: ['image-c'] },
      { id: 'image-a', type: 'image', name: 'Image A', parentId: 'all-images' },
      { id: 'image-b', type: 'image', name: 'Image B', parentId: 'all-images' },
      { id: 'image-c', type: 'image', name: 'Image C', parentId: 'folder-a' },
      { id: 'outside-root', type: 'image', name: 'Outside Root', parentId: 'elsewhere' },
    ],
  });

  const tree = document.getElementById('tree');
  tree.innerHTML = `
    <div data-node-id="all-images"><button data-role="tree-toggle">▾</button>All Images</div>
    <div data-node-id="folder-a"><button data-role="tree-toggle">▾</button>Folder A</div>
    <div data-node-id="image-c">Image C</div>
    <div data-node-id="image-a">Image A</div>
    <div data-node-id="image-b">Image B</div>
    <div data-node-id="outside-root">Outside Root</div>
  `;

  return { controller, callbacks };
}

describe('manageImagesWindow controller', () => {
  it('configures independent scrolling on the left tree pane', () => {
    const { controller } = setupController();
    expect(controller.treePane.style.overflowY).toBe('auto');
    expect(controller.treePane.style.overflowX).toBe('hidden');
  });

  it('supports ctrl and shift multi-selection semantics', () => {
    const { controller } = setupController();

    controller.updateSelectionFromEvent('image-a', {});
    controller.updateSelectionFromEvent('image-b', { ctrlKey: true });
    expect([...controller.selectedIds]).toEqual(['image-a', 'image-b']);

    controller.updateSelectionFromEvent('image-c', { shiftKey: true });
    expect([...controller.selectedIds]).toEqual(['image-c', 'image-a', 'image-b']);
  });

  it('disables rename and refresh when multiple nodes are selected', () => {
    const { controller } = setupController();

    controller.updateSelectionFromEvent('image-a', {});
    controller.updateSelectionFromEvent('image-b', { ctrlKey: true });

    expect(controller.toolbar.rename.disabled).toBe(true);
    expect(controller.toolbar.refresh.disabled).toBe(true);
  });

  it('shows image and folder context menus with appropriate actions', () => {
    const { controller } = setupController();

    controller.showContextMenu('image', 10, 20);
    expect(controller.contextMenus.image.classList.contains('hidden')).toBe(false);
    expect(controller.contextMenus.folder.classList.contains('hidden')).toBe(true);

    controller.showContextMenu('folder', 11, 21);
    expect(controller.contextMenus.folder.classList.contains('hidden')).toBe(false);
    expect(controller.contextMenus.image.classList.contains('hidden')).toBe(true);
    expect(controller.contextMenus.folder.textContent).not.toContain('Refresh');
  });

  it('returns explicit delete confirmations for images and folders', () => {
    const { controller } = setupController();

    controller.updateSelectionFromEvent('image-a', {});
    const imageDelete = controller.getDeleteDialogConfig();
    expect(imageDelete.title).toBe('Delete Image');
    expect(imageDelete.detail).toContain('Refresh from computer');

    controller.updateSelectionFromEvent('folder-a', {});
    const folderDelete = controller.getDeleteDialogConfig();
    expect(folderDelete.title).toBe('Delete Folder');
    expect(folderDelete.options.map((option) => option.label)).toEqual([
      'Delete Folder and Children',
      'Delete Folder and move Children to Parent',
      'Cancel',
    ]);
  });

  it('constrains drag/drop movement to the All Images subtree', () => {
    const { controller, callbacks } = setupController();

    expect(controller.canDrop('image-a', 'folder-a')).toBe(true);
    expect(controller.canDrop('image-a', 'outside-root')).toBe(false);

    controller.draggedNodeId = 'image-a';
    controller.handleDrop({
      target: document.querySelector('[data-node-id="folder-a"]'),
      preventDefault: vi.fn(),
    });

    expect(callbacks.onMove).toHaveBeenCalledWith({
      draggedId: 'image-a',
      targetId: 'folder-a',
      mode: 'move',
    });
  });
});
