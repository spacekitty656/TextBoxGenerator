function getRequiredElementById(documentRef, id) {
  const element = documentRef.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

export function createManageFontsView(documentRef) {
  return {
    window: {
      openButton: getRequiredElementById(documentRef, 'manage-fonts-button'),
      overlay: getRequiredElementById(documentRef, 'manage-fonts-overlay'),
      closeButton: getRequiredElementById(documentRef, 'close-manage-fonts-window'),
      okButton: getRequiredElementById(documentRef, 'manage-fonts-ok'),
    },
    tree: {
      input: getRequiredElementById(documentRef, 'manage-fonts-input'),
      tree: getRequiredElementById(documentRef, 'manage-fonts-tree'),
    },
    actions: {
      importButton: getRequiredElementById(documentRef, 'manage-fonts-import'),
      createFolderButton: getRequiredElementById(documentRef, 'manage-fonts-create-folder'),
      renameButton: getRequiredElementById(documentRef, 'manage-fonts-rename'),
      deleteButton: getRequiredElementById(documentRef, 'manage-fonts-delete'),
    },
  };
}
