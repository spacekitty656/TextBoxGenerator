import { createTemplateTreeDialogController } from './templateTreeDialogController.js';

export function createSaveBorderTemplateWindowController({ store, elements, onTemplateSaved, onStoreChanged }) {
  const controller = createTemplateTreeDialogController({
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

  return {
    ...controller,
    open: (options = {}) => controller.open(options),
  };
}
