function cloneSlotState(slotState = {}) {
  return {
    imageId: slotState?.imageId || null,
    rotation: Number.isFinite(slotState?.rotation) ? slotState.rotation : 0,
    flipX: Boolean(slotState?.flipX),
    flipY: Boolean(slotState?.flipY),
  };
}

function cloneImageBorderGroup(group = {}) {
  return Object.fromEntries(
    Object.entries(group).map(([slotName, slotState]) => [slotName, cloneSlotState(slotState)]),
  );
}

export function createBorderTemplateAdapterService({
  elements,
  state,
  borderState,
  updateBorderControlsState,
  syncColorPreviewButtons,
  requestRender,
}) {
  function captureTemplateData() {
    const {
      borderWidthInput,
      borderRadiusInput,
      borderColorSolidRadio,
      borderColorInsideOutRadio,
      borderColorImagesRadio,
      borderColorInput,
      borderBackgroundColorTransparentRadio,
      borderBackgroundColorSolidRadio,
      borderBackgroundColorInput,
      centerPaddingInput,
      sidePaddingControls,
      imageBorderSizingModeInput,
      imageBorderRepeatModeInput,
    } = elements;

    return {
      borderWidthValue: borderWidthInput.value,
      borderRadiusValue: borderRadiusInput.value,
      colorMode: borderColorInsideOutRadio.checked
        ? 'inside-out'
        : (borderColorImagesRadio.checked ? 'images' : 'solid'),
      color: borderColorInput.value,
      insideOutColorValues: borderState.getInsideOutColorValues(),
      backgroundMode: borderBackgroundColorSolidRadio.checked ? 'solid' : 'transparent',
      backgroundColor: borderBackgroundColorInput.value,
      centerPaddingValue: centerPaddingInput.value,
      lockState: {
        top: Boolean(state.lockState.top),
        right: Boolean(state.lockState.right),
        bottom: Boolean(state.lockState.bottom),
        left: Boolean(state.lockState.left),
      },
      sidePaddingValues: {
        top: sidePaddingControls.top.input.value,
        right: sidePaddingControls.right.input.value,
        bottom: sidePaddingControls.bottom.input.value,
        left: sidePaddingControls.left.input.value,
      },
      imageBorder: {
        corners: cloneImageBorderGroup(state.imageBorderState.corners),
        sides: cloneImageBorderGroup(state.imageBorderState.sides),
        sizingStrategy: imageBorderSizingModeInput?.value || 'auto',
        sideMode: imageBorderRepeatModeInput?.value || 'stretch',
      },
      radioState: {
        borderColorSolid: Boolean(borderColorSolidRadio.checked),
        borderColorInsideOut: Boolean(borderColorInsideOutRadio.checked),
        borderColorImages: Boolean(borderColorImagesRadio.checked),
        borderBackgroundColorTransparent: Boolean(borderBackgroundColorTransparentRadio.checked),
        borderBackgroundColorSolid: Boolean(borderBackgroundColorSolidRadio.checked),
      },
    };
  }

  function applyTemplateData(templateData = {}) {
    const normalizedTemplateData = templateData && typeof templateData === 'object'
      ? templateData
      : {};

    const {
      borderWidthInput,
      borderRadiusInput,
      borderColorSolidRadio,
      borderColorInsideOutRadio,
      borderColorImagesRadio,
      borderColorInput,
      borderBackgroundColorTransparentRadio,
      borderBackgroundColorSolidRadio,
      borderBackgroundColorInput,
      centerPaddingInput,
      sidePaddingControls,
      imageBorderSizingModeInput,
      imageBorderRepeatModeInput,
      imageBorderTransformInputs,
    } = elements;

    borderWidthInput.value = String(normalizedTemplateData.borderWidthValue ?? borderWidthInput.value);
    borderRadiusInput.value = String(normalizedTemplateData.borderRadiusValue ?? borderRadiusInput.value);
    borderColorInput.value = normalizedTemplateData.color || borderColorInput.value;
    borderBackgroundColorInput.value = normalizedTemplateData.backgroundColor || borderBackgroundColorInput.value;
    centerPaddingInput.value = String(normalizedTemplateData.centerPaddingValue ?? centerPaddingInput.value);

    const colorMode = normalizedTemplateData.colorMode;
    if (colorMode === 'solid' || colorMode === 'inside-out' || colorMode === 'images') {
      borderColorSolidRadio.checked = colorMode === 'solid';
      borderColorInsideOutRadio.checked = colorMode === 'inside-out';
      borderColorImagesRadio.checked = colorMode === 'images';
    }

    const backgroundMode = normalizedTemplateData.backgroundMode;
    if (backgroundMode === 'solid' || backgroundMode === 'transparent') {
      borderBackgroundColorSolidRadio.checked = backgroundMode === 'solid';
      borderBackgroundColorTransparentRadio.checked = backgroundMode !== 'solid';
    }

    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      sidePaddingControls[side].input.value = String(normalizedTemplateData?.sidePaddingValues?.[side] ?? sidePaddingControls[side].input.value);
      if (Object.prototype.hasOwnProperty.call(normalizedTemplateData?.lockState || {}, side)) {
        state.lockState[side] = Boolean(normalizedTemplateData?.lockState?.[side]);
      }
    });

    if (Array.isArray(normalizedTemplateData.insideOutColorValues)) {
      borderState.setInsideOutColorValues(normalizedTemplateData.insideOutColorValues);
    }

    if (normalizedTemplateData.imageBorder && typeof normalizedTemplateData.imageBorder === 'object') {
      ['corners', 'sides'].forEach((slotType) => {
        Object.entries(state.imageBorderState[slotType]).forEach(([slotName, slotState]) => {
          const nextSlotState = normalizedTemplateData.imageBorder?.[slotType]?.[slotName];
          if (!nextSlotState || typeof nextSlotState !== 'object') {
            return;
          }

          slotState.imageId = nextSlotState.imageId || null;
          slotState.rotation = Number.isFinite(nextSlotState.rotation) ? nextSlotState.rotation : 0;
          slotState.flipX = Boolean(nextSlotState.flipX);
          slotState.flipY = Boolean(nextSlotState.flipY);

          const controls = imageBorderTransformInputs?.[slotType]?.[slotName];
          if (controls) {
            controls.rotation.value = String(slotState.rotation);
            controls.flipX.checked = slotState.flipX;
            controls.flipY.checked = slotState.flipY;
          }

          borderState.updatePieceButtonLabel(slotType, slotName);
        });
      });
    }

    if (imageBorderSizingModeInput) {
      imageBorderSizingModeInput.value = normalizedTemplateData?.imageBorder?.sizingStrategy || imageBorderSizingModeInput.value;
    }

    if (imageBorderRepeatModeInput) {
      imageBorderRepeatModeInput.value = normalizedTemplateData?.imageBorder?.sideMode || imageBorderRepeatModeInput.value;
    }

    updateBorderControlsState();
    syncColorPreviewButtons();
    requestRender();
  }

  return {
    captureTemplateData,
    applyTemplateData,
  };
}
