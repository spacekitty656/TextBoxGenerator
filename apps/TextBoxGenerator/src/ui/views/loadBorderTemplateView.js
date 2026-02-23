function getRequiredElementById(documentRef, id) {
  const element = documentRef.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

export function createLoadBorderTemplateView(documentRef) {
  return {
    window: {
      overlay: getRequiredElementById(documentRef, 'load-border-template-overlay'),
      closeButton: getRequiredElementById(documentRef, 'close-load-border-template-window'),
      primaryButton: getRequiredElementById(documentRef, 'load-border-template-load'),
      secondaryButton: getRequiredElementById(documentRef, 'load-border-template-cancel'),
    },
    tree: {
      tree: getRequiredElementById(documentRef, 'load-border-template-tree'),
      contextMenu: getRequiredElementById(documentRef, 'load-border-template-context-menu'),
    },
    actions: {
      createFolderButton: getRequiredElementById(documentRef, 'load-border-template-create-folder'),
      renameButton: getRequiredElementById(documentRef, 'load-border-template-rename'),
      deleteButton: getRequiredElementById(documentRef, 'load-border-template-delete'),
    },
  };
}
