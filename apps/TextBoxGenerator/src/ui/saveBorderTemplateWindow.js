import { createTemplateTreeDialogController } from './templateTreeDialogController.js';

export function createSaveBorderTemplateWindowController({ store, elements, onTemplateSaved, onStoreChanged }) {
  return createTemplateTreeDialogController({
    store,
    mode: 'save',
    elements: {
      ...elements,
      primaryButton: elements.saveButton,
      secondaryButton: elements.cancelButton,
    },
    onStoreChanged,
    onSaveTemplate: onTemplateSaved,
  });
}
