import { createTemplateTreeDialogController } from './templateTreeDialogController.js';

export function createSaveBorderTemplateWindowController({ store, elements, onTemplateSaved }) {
  return createTemplateTreeDialogController({
    store,
    mode: 'save',
    elements: {
      ...elements,
      primaryButton: elements.saveButton,
      secondaryButton: elements.cancelButton,
    },
    onSaveTemplate: onTemplateSaved,
  });
}
