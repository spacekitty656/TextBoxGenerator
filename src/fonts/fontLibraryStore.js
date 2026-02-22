import { createHierarchicalTemplateStore } from '../templates/hierarchicalTemplateStore.js';

export const FONT_ROOT_FOLDER_NAME = 'All Fonts';

export const DEFAULT_EDITOR_FONTS = [
  { id: 'font-sansserif', value: 'sansserif', name: 'Sans Serif', family: 'Arial, Helvetica, sans-serif' },
  { id: 'font-serif', value: 'serif', name: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'font-monospace', value: 'monospace', name: 'Monospace', family: '"Courier New", Courier, monospace' },
  { id: 'font-pressstart2p', value: 'pressstart2p', name: 'Press Start 2P', family: '"Press Start 2P", "Courier New", monospace' },
];

export function createFontLibraryStore() {
  return createHierarchicalTemplateStore({
    rootFolderName: FONT_ROOT_FOLDER_NAME,
    defaultTemplates: DEFAULT_EDITOR_FONTS.map((font, index) => ({
      id: font.id,
      name: font.name,
      parentId: 'root',
      orderIndex: index,
      templateClass: 'font',
      immutable: true,
      data: {
        value: font.value,
        family: font.family,
      },
    })),
  });
}
