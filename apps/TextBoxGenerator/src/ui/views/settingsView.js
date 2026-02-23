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

export function createSettingsView(documentRef) {
  return {
    window: {
      openButton: getRequiredElementById(documentRef, 'settings-button'),
      overlay: getRequiredElementById(documentRef, 'settings-overlay'),
      closeButton: getRequiredElementById(documentRef, 'close-settings-window'),
    },
    preferences: {
      darkModeToggle: getOptionalElementById(documentRef, 'dark-mode-toggle'),
    },
  };
}
