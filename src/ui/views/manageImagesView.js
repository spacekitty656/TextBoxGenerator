function getRequiredElementById(documentRef, id) {
  const element = documentRef.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

export function createManageImagesView(documentRef) {
  return {
    window: {
      overlay: getRequiredElementById(documentRef, 'manage-images-overlay'),
      closeButton: getRequiredElementById(documentRef, 'close-manage-images-window'),
      okButton: getRequiredElementById(documentRef, 'manage-images-ok'),
      cancelButton: getRequiredElementById(documentRef, 'manage-images-cancel'),
    },
    tree: {
      input: getRequiredElementById(documentRef, 'manage-images-input'),
      refreshInput: getRequiredElementById(documentRef, 'manage-images-refresh-input'),
      tree: getRequiredElementById(documentRef, 'manage-images-tree'),
      contextMenu: getRequiredElementById(documentRef, 'manage-images-context-menu'),
    },
    actions: {
      importButton: getRequiredElementById(documentRef, 'manage-images-import'),
      createFolderButton: getRequiredElementById(documentRef, 'manage-images-create-folder'),
      refreshButton: getRequiredElementById(documentRef, 'manage-images-refresh'),
      renameButton: getRequiredElementById(documentRef, 'manage-images-rename'),
      deleteButton: getRequiredElementById(documentRef, 'manage-images-delete'),
    },
  };
}
