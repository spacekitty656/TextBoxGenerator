import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFontLibraryStore } from '../../src/fonts/fontLibraryStore.js';
import { createManageFontsWindowController } from '../../src/ui/manageFontsWindow.js';

function createElements() {
  const overlay = document.createElement('div');
  overlay.className = 'hidden';

  const elements = {
    window: {
      overlay,
      openButton: document.createElement('button'),
      closeButton: document.createElement('button'),
      cancelButton: document.createElement('button'),
    },
    tree: {
      input: document.createElement('input'),
      tree: document.createElement('div'),
    },
    actions: {
      importButton: document.createElement('button'),
      createFolderButton: document.createElement('button'),
      renameButton: document.createElement('button'),
      deleteButton: document.createElement('button'),
    },
  };

  document.body.append(overlay, elements.tree.tree, elements.tree.input, elements.window.openButton);
  return elements;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('manage fonts window', () => {
  it('renders root and immutable default fonts when opened', () => {
    const store = createFontLibraryStore();
    const elements = createElements();

    const controller = createManageFontsWindowController({
      store,
      elements,
      importFontFromFile: vi.fn(),
      onFontsChanged: vi.fn(),
    });

    expect(() => controller.open()).not.toThrow();

    const rows = Array.from(elements.tree.tree.querySelectorAll('.manage-tree-row'));
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.some((row) => row.textContent.includes('All Fonts'))).toBe(true);
    expect(rows.some((row) => row.textContent.includes('Sans Serif'))).toBe(true);
    expect(rows.some((row) => row.textContent.includes('Press Start 2P'))).toBe(true);
  });
});
