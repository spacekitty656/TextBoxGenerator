import { createHierarchicalTemplateStore } from '../templates/hierarchicalTemplateStore.js';

const BORDER_TEMPLATE_ROOT_NAME = 'All Border Templates';
const DEFAULT_BORDER_TEMPLATE_ID = 'template-border-default';

export function createTemplateLibraryStore() {
  return createHierarchicalTemplateStore({
    rootFolderName: BORDER_TEMPLATE_ROOT_NAME,
    defaultTemplates: [
      {
        id: DEFAULT_BORDER_TEMPLATE_ID,
        name: 'Default Border Template',
        parentId: 'root',
        orderIndex: 0,
        templateClass: 'border',
        data: null,
        immutable: true,
      },
    ],
  });
}

export {
  BORDER_TEMPLATE_ROOT_NAME,
  DEFAULT_BORDER_TEMPLATE_ID,
};
