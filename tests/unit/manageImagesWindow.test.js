import { beforeEach, describe, expect, it, vi } from 'vitest';

const dialogQueue = [];

vi.mock('../../src/ui/windowDialog.js', () => ({
  openWindowChoiceDialog: vi.fn(async () => dialogQueue.shift() ?? 'cancel'),
}));

import { createImageLibraryStore } from '../../src/images/libraryStore.js';
import { createManageImagesWindowController } from '../../src/ui/manageImagesWindow.js';

function createElements() {
  const overlay = document.createElement('div');
  overlay.className = 'hidden';
  const tree = document.createElement('div');
  const contextMenu = document.createElement('div');
  contextMenu.className = 'hidden';

  const elements = {
    overlay,
    tree,
    contextMenu,
    importButton: document.createElement('button'),
    createFolderButton: document.createElement('button'),
    renameButton: document.createElement('button'),
    refreshButton: document.createElement('button'),
    deleteButton: document.createElement('button'),
    okButton: document.createElement('button'),
    cancelButton: document.createElement('button'),
    closeButton: document.createElement('button'),
    input: document.createElement('input'),
    refreshInput: document.createElement('input'),
  };

  document.body.append(overlay, tree, contextMenu, elements.input, elements.refreshInput);
  return elements;
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  document.body.innerHTML = '';
  dialogQueue.length = 0;
});

describe('manage images window', () => {
  it('selects imported image in the tree', async () => {
    const store = createImageLibraryStore();
    const elements = createElements();

    createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(async () => ({ image: { width: 1, height: 1 }, dataUrl: 'data:image/png;base64,x', mimeType: 'image/png' })),
    }).open();

    const file = new File(['x'], 'imported.png', { type: 'image/png' });
    Object.defineProperty(elements.input, 'files', { configurable: true, value: [file] });
    elements.input.dispatchEvent(new Event('change'));
    await flush();

    const rows = Array.from(elements.tree.querySelectorAll('.manage-tree-row'));
    const selectedRows = rows.filter((row) => row.classList.contains('active'));

    expect(rows.some((row) => row.textContent.includes('imported.png'))).toBe(true);
    expect(selectedRows).toHaveLength(1);
    expect(selectedRows[0].textContent).toContain('imported.png');
  });

  it('supports folder deletion strategies: move, delete, and cancel', async () => {
    const store = createImageLibraryStore();
    const parent = store.createFolder({ name: 'Parent' });
    const childFolder = store.createFolder({ name: 'Child', parentId: parent.id });
    const childImage = store.createImage({ name: 'child.png', parentId: parent.id });

    const elements = createElements();
    const controller = createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
    });

    controller.open();
    elements.tree.querySelector(`[data-entity-key="folder:${parent.id}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    dialogQueue.push('move');
    elements.deleteButton.click();
    await flush();

    expect(store.getFolder(parent.id)).toBeNull();
    expect(store.getFolder(childFolder.id)?.parentId).toBe(store.ROOT_FOLDER_ID);
    expect(store.getImage(childImage.id)?.parentId).toBe(store.ROOT_FOLDER_ID);

    const parent2 = store.createFolder({ name: 'Parent 2' });
    const nested2 = store.createFolder({ name: 'Nested 2', parentId: parent2.id });
    controller.render();
    elements.tree.querySelector(`[data-entity-key="folder:${parent2.id}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    dialogQueue.push('delete');
    elements.deleteButton.click();
    await flush();

    expect(store.getFolder(parent2.id)).toBeNull();
    expect(store.getFolder(nested2.id)).toBeNull();

    const parent3 = store.createFolder({ name: 'Parent 3' });
    controller.render();
    elements.tree.querySelector(`[data-entity-key="folder:${parent3.id}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    dialogQueue.push('cancel');
    elements.deleteButton.click();
    await flush();

    expect(store.getFolder(parent3.id)).toBeTruthy();
  });

  it('applies selected image on double click and Enter in slot mode', () => {
    const store = createImageLibraryStore();
    const image = store.createImage({ name: 'Select me' });
    const elements = createElements();
    const onSelectionApplied = vi.fn();
    const controller = createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
      onSelectionApplied,
    });

    controller.open({ slotType: 'corners', slotName: 'topLeft' });

    const imageRow = elements.tree.querySelector(`[data-entity-key="image:${image.id}"]`);
    imageRow.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(onSelectionApplied).toHaveBeenCalledWith({ slotType: 'corners', slotName: 'topLeft' }, image.id);

    controller.open({ slotType: 'corners', slotName: 'topLeft' });
    elements.tree.querySelector(`[data-entity-key="image:${image.id}"]`)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const handled = controller.handleEnterKey(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handled).toBe(true);
    expect(onSelectionApplied).toHaveBeenCalledTimes(2);
  });

  it('supports multiselect and context menu interactions', () => {
    const store = createImageLibraryStore();
    const imageA = store.createImage({ name: 'A' });
    const imageB = store.createImage({ name: 'B' });
    const elements = createElements();

    createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
    }).open();

    const rowA = elements.tree.querySelector(`[data-entity-key="image:${imageA.id}"]`);
    const rowB = elements.tree.querySelector(`[data-entity-key="image:${imageB.id}"]`);

    rowA.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    rowB.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));

    const selectedRows = Array.from(elements.tree.querySelectorAll('.manage-tree-row.active'));
    expect(selectedRows).toHaveLength(2);

    rowA.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 20, clientY: 20 }));
    expect(elements.contextMenu.classList.contains('hidden')).toBe(false);
    expect(elements.contextMenu.textContent).toContain('Delete');
  });
});
