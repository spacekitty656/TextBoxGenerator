import { createTemplateTreeDialogController } from './templateTreeDialogController.js';

export function createLoadBorderTemplateWindowController({ store, elements, onTemplateLoaded }) {
  return createTemplateTreeDialogController({
    store,
    mode: 'load',
    elements: {
      ...elements,
      primaryButton: elements.loadButton,
      secondaryButton: elements.cancelButton,
    },
    onLoadTemplate: onTemplateLoaded,
  });
}
