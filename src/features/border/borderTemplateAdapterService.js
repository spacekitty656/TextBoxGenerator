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
      borderToggle,
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
      enabled: Boolean(borderToggle.checked),
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
    const {
      borderToggle,
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

    borderToggle.checked = Boolean(templateData.enabled);
    borderWidthInput.value = String(templateData.borderWidthValue ?? borderWidthInput.value);
    borderRadiusInput.value = String(templateData.borderRadiusValue ?? borderRadiusInput.value);
    borderColorInput.value = templateData.color || '#000000';
    borderBackgroundColorInput.value = templateData.backgroundColor || '#ffffff';
    centerPaddingInput.value = String(templateData.centerPaddingValue ?? centerPaddingInput.value);

    const colorMode = templateData.colorMode;
    borderColorSolidRadio.checked = colorMode === 'solid';
    borderColorInsideOutRadio.checked = colorMode === 'inside-out';
    borderColorImagesRadio.checked = colorMode === 'images';

    const backgroundMode = templateData.backgroundMode;
    borderBackgroundColorSolidRadio.checked = backgroundMode === 'solid';
    borderBackgroundColorTransparentRadio.checked = backgroundMode !== 'solid';

    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      sidePaddingControls[side].input.value = String(templateData?.sidePaddingValues?.[side] ?? sidePaddingControls[side].input.value);
      state.lockState[side] = Boolean(templateData?.lockState?.[side]);
    });

    borderState.setInsideOutColorValues(templateData.insideOutColorValues || []);

    ['corners', 'sides'].forEach((slotType) => {
      Object.entries(state.imageBorderState[slotType]).forEach(([slotName, slotState]) => {
        const nextSlotState = templateData?.imageBorder?.[slotType]?.[slotName] || {};
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

    if (imageBorderSizingModeInput) {
      imageBorderSizingModeInput.value = templateData?.imageBorder?.sizingStrategy || 'auto';
    }

    if (imageBorderRepeatModeInput) {
      imageBorderRepeatModeInput.value = templateData?.imageBorder?.sideMode || 'stretch';
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
