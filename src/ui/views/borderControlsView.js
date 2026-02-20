function getRequiredElementById(documentRef, id) {
  const element = documentRef.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

export function createBorderControlsView(documentRef) {
  return {
    toggles: {
      borderToggle: getRequiredElementById(documentRef, 'enable-border'),
      borderOptions: getRequiredElementById(documentRef, 'border-options'),
      wrapTextInput: getRequiredElementById(documentRef, 'wrap-text'),
      maxImageWidthInput: getRequiredElementById(documentRef, 'max-image-width'),
    },
    borderStyle: {
      widthInput: getRequiredElementById(documentRef, 'border-width'),
      radiusInput: getRequiredElementById(documentRef, 'border-radius'),
      borderColorInput: getRequiredElementById(documentRef, 'border-color-input'),
      borderBackgroundColorInput: getRequiredElementById(documentRef, 'border-background-color-input'),
      backgroundColorInput: getRequiredElementById(documentRef, 'background-color-input'),
    },
    colorModes: {
      borderColorSolidRadio: getRequiredElementById(documentRef, 'border-color-solid'),
      borderColorInsideOutRadio: getRequiredElementById(documentRef, 'border-color-inside-out'),
      borderColorImagesRadio: getRequiredElementById(documentRef, 'border-color-images'),
      backgroundColorTransparentRadio: getRequiredElementById(documentRef, 'background-color-transparent'),
      backgroundColorSolidRadio: getRequiredElementById(documentRef, 'background-color-solid'),
      borderBackgroundColorTransparentRadio: getRequiredElementById(documentRef, 'border-background-color-transparent'),
      borderBackgroundColorSolidRadio: getRequiredElementById(documentRef, 'border-background-color-solid'),
    },
    insideOut: {
      colorsContainer: getRequiredElementById(documentRef, 'inside-out-colors'),
      colorList: getRequiredElementById(documentRef, 'inside-out-color-list'),
      addColorButton: getRequiredElementById(documentRef, 'inside-out-add-color'),
    },
    imageBorder: {
      controls: getRequiredElementById(documentRef, 'image-border-controls'),
      sizingModeInput: getRequiredElementById(documentRef, 'image-border-sizing-mode'),
      repeatModeInput: getRequiredElementById(documentRef, 'image-border-repeat-mode'),
      cornerButtons: {
        topLeft: getRequiredElementById(documentRef, 'image-border-corner-top-left'),
        topRight: getRequiredElementById(documentRef, 'image-border-corner-top-right'),
        bottomRight: getRequiredElementById(documentRef, 'image-border-corner-bottom-right'),
        bottomLeft: getRequiredElementById(documentRef, 'image-border-corner-bottom-left'),
      },
      sideButtons: {
        top: getRequiredElementById(documentRef, 'image-border-side-top'),
        right: getRequiredElementById(documentRef, 'image-border-side-right'),
        bottom: getRequiredElementById(documentRef, 'image-border-side-bottom'),
        left: getRequiredElementById(documentRef, 'image-border-side-left'),
      },
      transformInputs: {
        corners: {
          topLeft: {
            rotation: getRequiredElementById(documentRef, 'image-border-corner-top-left-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-corner-top-left-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-corner-top-left-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-corner-top-left-clear'),
          },
          topRight: {
            rotation: getRequiredElementById(documentRef, 'image-border-corner-top-right-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-corner-top-right-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-corner-top-right-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-corner-top-right-clear'),
          },
          bottomRight: {
            rotation: getRequiredElementById(documentRef, 'image-border-corner-bottom-right-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-corner-bottom-right-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-corner-bottom-right-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-corner-bottom-right-clear'),
          },
          bottomLeft: {
            rotation: getRequiredElementById(documentRef, 'image-border-corner-bottom-left-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-corner-bottom-left-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-corner-bottom-left-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-corner-bottom-left-clear'),
          },
        },
        sides: {
          top: {
            rotation: getRequiredElementById(documentRef, 'image-border-side-top-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-side-top-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-side-top-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-side-top-clear'),
          },
          right: {
            rotation: getRequiredElementById(documentRef, 'image-border-side-right-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-side-right-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-side-right-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-side-right-clear'),
          },
          bottom: {
            rotation: getRequiredElementById(documentRef, 'image-border-side-bottom-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-side-bottom-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-side-bottom-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-side-bottom-clear'),
          },
          left: {
            rotation: getRequiredElementById(documentRef, 'image-border-side-left-rotation'),
            flipX: getRequiredElementById(documentRef, 'image-border-side-left-flip-x'),
            flipY: getRequiredElementById(documentRef, 'image-border-side-left-flip-y'),
            clear: getRequiredElementById(documentRef, 'image-border-side-left-clear'),
          },
        },
      },
    },
  };
}
