function getRequiredElementById(documentRef, id) {
  const element = documentRef.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

export function createSaveBorderTemplateView(documentRef) {
  return {
    window: {
      overlay: getRequiredElementById(documentRef, 'save-border-template-overlay'),
      closeButton: getRequiredElementById(documentRef, 'close-save-border-template-window'),
      primaryButton: getRequiredElementById(documentRef, 'save-border-template-save'),
      secondaryButton: getRequiredElementById(documentRef, 'save-border-template-cancel'),
    },
    tree: {
      tree: getRequiredElementById(documentRef, 'save-border-template-tree'),
      contextMenu: getRequiredElementById(documentRef, 'save-border-template-context-menu'),
    },
    actions: {
      createTemplateButton: getRequiredElementById(documentRef, 'save-border-template-create-template'),
      createFolderButton: getRequiredElementById(documentRef, 'save-border-template-create-folder'),
      renameButton: getRequiredElementById(documentRef, 'save-border-template-rename'),
      deleteButton: getRequiredElementById(documentRef, 'save-border-template-delete'),
    },
  };
}
