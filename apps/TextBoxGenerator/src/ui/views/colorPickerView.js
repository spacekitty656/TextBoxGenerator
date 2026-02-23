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

export function createColorPickerView(documentRef) {
  return {
    window: {
      overlay: getRequiredElementById(documentRef, 'color-window-overlay'),
      closeButton: getRequiredElementById(documentRef, 'close-color-window'),
      title: getRequiredElementById(documentRef, 'color-window-title'),
      okButton: getRequiredElementById(documentRef, 'color-window-ok'),
      cancelButton: getRequiredElementById(documentRef, 'color-window-cancel'),
    },
    grids: {
      basicColors: getOptionalElementBySelector(documentRef, '.basic-colors-grid'),
      customColors: getOptionalElementBySelector(documentRef, '.custom-colors-grid'),
      addCustomColorButton: getRequiredElementById(documentRef, 'add-custom-color'),
      pickScreenColorButton: getRequiredElementById(documentRef, 'pick-screen-color'),
    },
    triggerButtons: {
      openBackgroundColorWindowButton: getOptionalElementBySelector(documentRef, '.ql-open-background-color-window'),
      backgroundColorWindowButton: getRequiredElementById(documentRef, 'background-color-window-button'),
      borderColorWindowButton: getRequiredElementById(documentRef, 'border-color-window-button'),
      borderBackgroundColorWindowButton: getRequiredElementById(documentRef, 'border-background-color-window-button'),
    },
    picker: {
      colorMap: getRequiredElementById(documentRef, 'color-map'),
      colorMapHandle: getRequiredElementById(documentRef, 'color-map-handle'),
      colorSlider: getRequiredElementById(documentRef, 'color-slider'),
      colorSliderHandle: getRequiredElementById(documentRef, 'color-slider-handle'),
      selectedColorPreview: getRequiredElementById(documentRef, 'selected-color-preview'),
      valueInputs: {
        hue: getRequiredElementById(documentRef, 'color-value-hue'),
        sat: getRequiredElementById(documentRef, 'color-value-sat'),
        val: getRequiredElementById(documentRef, 'color-value-val'),
        red: getRequiredElementById(documentRef, 'color-value-red'),
        green: getRequiredElementById(documentRef, 'color-value-green'),
        blue: getRequiredElementById(documentRef, 'color-value-blue'),
        alpha: getRequiredElementById(documentRef, 'color-value-alpha'),
        hex: getRequiredElementById(documentRef, 'color-value-hex'),
      },
    },
  };
}
