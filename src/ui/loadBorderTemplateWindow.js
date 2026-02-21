import { createTemplateTreeDialogController } from './templateTreeDialogController.js';

export function createLoadBorderTemplateWindowController({ store, elements, onTemplateLoaded, onStoreChanged }) {
  const controller = createTemplateTreeDialogController({
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

  return {
    ...controller,
    open: (options = {}) => controller.open(options),
  };
}
