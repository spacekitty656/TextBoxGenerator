import { createTemplateTreeDialogController } from './templateTreeDialogController.js';

export function createLoadBorderTemplateWindowController({ store, elements, onTemplateLoaded, onStoreChanged }) {
  return createTemplateTreeDialogController({
    store,
    mode: 'load',
    elements: {
      ...elements,
      primaryButton: elements.loadButton,
      secondaryButton: elements.cancelButton,
    },
    onStoreChanged,
    onLoadTemplate: onTemplateLoaded,
  });
}
