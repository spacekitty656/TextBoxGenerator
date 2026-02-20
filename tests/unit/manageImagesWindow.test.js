import { describe, expect, it, vi } from 'vitest';

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

  it('clears selection when clicking empty tree area', () => {
    const store = createImageLibraryStore();
    store.createImage({ name: 'A' });
    const elements = createElements();

    createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
    }).open({ slotType: 'sides', slotName: 'top' });

    const imageRow = elements.tree.querySelector('.manage-tree-row[data-entity-key^="image:"]');
    imageRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(elements.okButton.disabled).toBe(false);

    elements.tree.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(elements.okButton.disabled).toBe(true);
  });

  it('applies selected image on double click in slot mode', () => {
    const store = createImageLibraryStore();
    const image = store.createImage({ name: 'Double' });
    const elements = createElements();
    const onSelectionApplied = vi.fn();

    createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
      onSelectionApplied,
    }).open({ slotType: 'corners', slotName: 'topLeft' });

    const imageRow = elements.tree.querySelector(`[data-entity-key="image:${image.id}"]`);
    imageRow.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(onSelectionApplied).toHaveBeenCalledWith({ slotType: 'corners', slotName: 'topLeft' }, image.id);
  });

  it('toggles folder collapsed state on double click', () => {
    const store = createImageLibraryStore();
    const folder = store.createFolder({ name: 'Folder A' });
    store.createImage({ name: 'Nested', parentId: folder.id });
    const elements = createElements();

    createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
    }).open();

    const folderRow = elements.tree.querySelector(`[data-entity-key="folder:${folder.id}"]`);
    expect(elements.tree.textContent).toContain('Nested');

    folderRow.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(elements.tree.textContent).not.toContain('Nested');

    const updatedFolderRow = elements.tree.querySelector(`[data-entity-key="folder:${folder.id}"]`);
    updatedFolderRow.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(elements.tree.textContent).toContain('Nested');
  });

  it('triggers delete action on Delete key when selection exists', () => {
    const store = createImageLibraryStore();
    const image = store.createImage({ name: 'Delete Me' });
    const elements = createElements();
    const controller = createManageImagesWindowController({
      store,
      elements,
      loadImageFromFile: vi.fn(),
    });

    controller.open();

    const imageRow = elements.tree.querySelector(`[data-entity-key="image:${image.id}"]`);
    imageRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const clickSpy = vi.spyOn(elements.deleteButton, 'click');
    const handled = controller.handleDeleteKey(new KeyboardEvent('keydown', { key: 'Delete' }));

    expect(handled).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
