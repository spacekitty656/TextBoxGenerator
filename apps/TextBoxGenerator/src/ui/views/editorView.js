function getRequiredElementById(documentRef, id) {
  const element = documentRef.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

function getOptionalElementById(documentRef, id) {
  return documentRef.getElementById(id) || null;
}

function getOptionalElementBySelector(documentRef, selector) {
  return documentRef.querySelector(selector) || null;
}

export function createEditorView(documentRef) {
  return {
    canvas: {
      preview: getRequiredElementById(documentRef, 'preview-canvas'),
      panel: getOptionalElementBySelector(documentRef, '.canvas-panel'),
    },
    editor: {
      root: getRequiredElementById(documentRef, 'editor'),
      formPanel: getOptionalElementBySelector(documentRef, '.form-panel'),
      wrapTextInput: getOptionalElementById(documentRef, 'wrap-text'),
      maxImageWidthInput: getOptionalElementById(documentRef, 'max-image-width'),
    },
    output: {
      saveButton: getRequiredElementById(documentRef, 'save-image'),
      imageNameInput: getRequiredElementById(documentRef, 'image-name'),
      appVersionBadge: getOptionalElementById(documentRef, 'app-version'),
      storageStatusMessage: getOptionalElementById(documentRef, 'storage-status-message'),
    },
    padding: {
      text: {
        centerInput: getRequiredElementById(documentRef, 'padding-center'),
        sides: {
          top: {
            input: getRequiredElementById(documentRef, 'padding-top'),
            lock: getRequiredElementById(documentRef, 'lock-top'),
          },
          right: {
            input: getRequiredElementById(documentRef, 'padding-right'),
            lock: getRequiredElementById(documentRef, 'lock-right'),
          },
          bottom: {
            input: getRequiredElementById(documentRef, 'padding-bottom'),
            lock: getRequiredElementById(documentRef, 'lock-bottom'),
          },
          left: {
            input: getRequiredElementById(documentRef, 'padding-left'),
            lock: getRequiredElementById(documentRef, 'lock-left'),
          },
        },
      },
      image: {
        centerInput: getRequiredElementById(documentRef, 'image-padding-center'),
        sides: {
          top: {
            input: getRequiredElementById(documentRef, 'image-padding-top'),
            lock: getRequiredElementById(documentRef, 'image-lock-top'),
          },
          right: {
            input: getRequiredElementById(documentRef, 'image-padding-right'),
            lock: getRequiredElementById(documentRef, 'image-lock-right'),
          },
          bottom: {
            input: getRequiredElementById(documentRef, 'image-padding-bottom'),
            lock: getRequiredElementById(documentRef, 'image-lock-bottom'),
          },
          left: {
            input: getRequiredElementById(documentRef, 'image-padding-left'),
            lock: getRequiredElementById(documentRef, 'image-lock-left'),
          },
        },
      },
    },
  };
}
