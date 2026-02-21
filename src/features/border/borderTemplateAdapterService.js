function cloneSlotGroup(slotGroup = {}) {
  return Object.fromEntries(
    Object.entries(slotGroup).map(([slotName, slotState]) => [
      slotName,
      {
        imageId: slotState?.imageId || null,
        rotation: Number.parseInt(slotState?.rotation, 10) || 0,
        flipX: Boolean(slotState?.flipX),
        flipY: Boolean(slotState?.flipY),
      },
    ]),
  );
}

export function createBorderTemplateAdapterService({ elements, state, borderState, actions }) {
  function captureTemplatePayload() {
    return {
      borderEnabled: elements.borderToggle.checked,
      borderWidth: elements.borderWidthInput.value,
      borderRadius: elements.borderRadiusInput.value,
      colorMode: elements.borderColorSolidRadio.checked
        ? 'solid'
        : (elements.borderColorInsideOutRadio.checked ? 'inside-out' : 'images'),
      borderColor: elements.borderColorInput.value,
      insideOutColors: borderState.getInsideOutColorValues(),
      borderBackgroundMode: elements.borderBackgroundColorSolidRadio.checked ? 'solid' : 'transparent',
      borderBackgroundColor: elements.borderBackgroundColorInput.value,
      centerPadding: elements.centerPaddingInput.value,
      sidePadding: {
        top: elements.sidePaddingControls.top.input.value,
        right: elements.sidePaddingControls.right.input.value,
        bottom: elements.sidePaddingControls.bottom.input.value,
        left: elements.sidePaddingControls.left.input.value,
      },
      lockState: {
        top: Boolean(state.lockState.top),
        right: Boolean(state.lockState.right),
        bottom: Boolean(state.lockState.bottom),
        left: Boolean(state.lockState.left),
      },
      imageBorder: {
        sizingStrategy: elements.imageBorderSizingModeInput?.value || 'auto',
        sideMode: elements.imageBorderRepeatModeInput?.value || 'stretch',
        corners: cloneSlotGroup(state.imageBorderState.corners),
        sides: cloneSlotGroup(state.imageBorderState.sides),
      },
    };
  }

  function ensureInsideOutRows(targetCount) {
    while (borderState.getInsideOutColorValues().length < targetCount) {
      borderState.createInsideOutColorRow('#1f2937');
    }

    while (borderState.getInsideOutColorValues().length > targetCount) {
      const rows = elements.insideOutColorList.querySelectorAll('.inside-out-color-row');
      const lastRow = rows[rows.length - 1];
      lastRow?.querySelector('.inside-out-delete')?.click();
    }
  }

  function setImageBorderFromTemplate(imageBorder = {}) {
    const nextCorners = imageBorder.corners || {};
    const nextSides = imageBorder.sides || {};

    ['corners', 'sides'].forEach((slotType) => {
      const sourceGroup = slotType === 'corners' ? nextCorners : nextSides;
      const targetGroup = state.imageBorderState[slotType] || {};
      const inputsGroup = elements.imageBorderTransformInputs[slotType] || {};

      Object.entries(targetGroup).forEach(([slotName, slotState]) => {
        const nextSlot = sourceGroup[slotName] || {};
        slotState.imageId = nextSlot.imageId || null;
        slotState.rotation = Number.parseInt(nextSlot.rotation, 10) || 0;
        slotState.flipX = Boolean(nextSlot.flipX);
        slotState.flipY = Boolean(nextSlot.flipY);

        const controls = inputsGroup[slotName];
        if (controls) {
          controls.rotation.value = String(slotState.rotation);
          controls.flipX.checked = slotState.flipX;
          controls.flipY.checked = slotState.flipY;
        }

        borderState.updatePieceButtonLabel(slotType, slotName);
      });
    });

    elements.imageBorderSizingModeInput.value = imageBorder.sizingStrategy || 'auto';
    elements.imageBorderRepeatModeInput.value = imageBorder.sideMode || 'stretch';
  }

  function applyTemplatePayload(payload) {
    const template = payload || {};
    elements.borderToggle.checked = Boolean(template.borderEnabled);
    elements.borderWidthInput.value = template.borderWidth ?? elements.borderWidthInput.value;
    elements.borderRadiusInput.value = template.borderRadius ?? elements.borderRadiusInput.value;
    elements.borderColorInput.value = template.borderColor || '#000000';
    elements.borderBackgroundColorInput.value = template.borderBackgroundColor || '#000000';
    elements.centerPaddingInput.value = template.centerPadding ?? elements.centerPaddingInput.value;

    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      if (Object.prototype.hasOwnProperty.call(template?.sidePadding || {}, side)) {
        elements.sidePaddingControls[side].input.value = template.sidePadding[side];
      }

      if (Object.prototype.hasOwnProperty.call(template?.lockState || {}, side)) {
        state.lockState[side] = Boolean(template.lockState[side]);
      }
    });

    const colorMode = template.colorMode || 'solid';
    elements.borderColorSolidRadio.checked = colorMode === 'solid';
    elements.borderColorInsideOutRadio.checked = colorMode === 'inside-out';
    elements.borderColorImagesRadio.checked = colorMode === 'images';

    const backgroundMode = template.borderBackgroundMode || 'transparent';
    elements.borderBackgroundColorSolidRadio.checked = backgroundMode === 'solid';
    elements.borderBackgroundColorTransparentRadio.checked = backgroundMode !== 'solid';

    const insideOutValues = Array.isArray(template.insideOutColors) && template.insideOutColors.length
      ? template.insideOutColors
      : ['#1f2937'];
    ensureInsideOutRows(insideOutValues.length);
    const insideOutInputs = elements.insideOutColorList.querySelectorAll('.inside-out-color-row input[type="color"]');
    insideOutValues.forEach((value, index) => {
      if (insideOutInputs[index]) {
        insideOutInputs[index].value = value;
      }
    });

    setImageBorderFromTemplate(template.imageBorder);

    actions.syncLockedPaddingValues();
    actions.updateBorderControlsState();
    actions.syncColorPreviewButtons();
    actions.requestRender();
  }

  return {
    captureTemplatePayload,
    applyTemplatePayload,
  };
}
