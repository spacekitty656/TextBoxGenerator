import { describe, expect, it } from 'vitest';

import { createFontLibraryStore } from '../../src/fonts/fontLibraryStore.js';
import { persistFontLibrary, restoreFontLibrary } from '../../src/fonts/fontLibraryPersistence.js';

function createStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) || null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

describe('font library persistence', () => {
  it('persists and restores imported fonts', () => {
    const storage = createStorage();
    const source = createFontLibraryStore();

    source.createTemplate({
      name: 'My Font',
      parentId: source.ROOT_FOLDER_ID,
      templateClass: 'font',
      data: {
        value: 'my-font',
        family: '"My Font", sans-serif',
        familyName: 'My Font',
        sourceDataUrl: 'data:font/ttf;base64,AAAA',
      },
    });

    persistFontLibrary(storage, source);

    const restored = createFontLibraryStore();
    const didRestore = restoreFontLibrary(storage, restored);
    const entries = restored.listTemplatesByClass('font');

    expect(didRestore).toBe(true);
    expect(entries.some((entry) => entry.name === 'My Font' && entry.data.value === 'my-font')).toBe(true);
  });
});
