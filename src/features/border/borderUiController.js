import { createBorderController } from '../../controllers/borderController.js';
import { createBorderConfigAdapter } from './borderConfigAdapter.js';

export function createBorderUiController({ elements, borderState, state, actions, callbacks, helpers }) {
  function resolveBorderColorMode() {
    const {
      borderColorSolidRadio,
      borderColorInsideOutRadio,
      borderColorImagesRadio,
    } = elements;
    const modeRadios = [borderColorSolidRadio, borderColorInsideOutRadio, borderColorImagesRadio];
    const selectedMode = modeRadios.find((radioInput) => radioInput?.checked)?.value;

    if (selectedMode === 'inside-out' || selectedMode === 'images') {
      return selectedMode;
    }

    return 'solid';
  }

  function getManagedImageSize(imageId) {
    const imageRecord = helpers.getManagedImageById(imageId);
    if (!imageRecord?.image) {
      return { width: 0, height: 0 };
    }

    return {
      width: imageRecord.image.width || imageRecord.image.naturalWidth || 0,
      height: imageRecord.image.height || imageRecord.image.naturalHeight || 0,
    };
  }

  function canEnablePaddingRounding() {
    const isBorderEnabled = Boolean(elements.borderToggle?.checked);
    const inImageMode = resolveBorderColorMode() === 'images';
    const inRepeatMode = elements.imageBorderRepeatModeInput?.value === 'repeat';

    if (!isBorderEnabled || !inImageMode || !inRepeatMode) {
      return { horizontal: false, vertical: false };
    }

    const topSize = getManagedImageSize(state.imageBorderState?.sides?.top?.imageId);
    const bottomSize = getManagedImageSize(state.imageBorderState?.sides?.bottom?.imageId);
    const leftSize = getManagedImageSize(state.imageBorderState?.sides?.left?.imageId);
    const rightSize = getManagedImageSize(state.imageBorderState?.sides?.right?.imageId);

    return {
      horizontal: topSize.width > 0 && topSize.width === bottomSize.width,
      vertical: leftSize.height > 0 && leftSize.height === rightSize.height,
    };
  }

  function updatePaddingRoundingInputsState() {
    const {
      borderPaddingRoundHorizontalInput,
      borderPaddingRoundVerticalInput,
    } = elements;

    const enabledState = canEnablePaddingRounding();

    if (borderPaddingRoundHorizontalInput) {
      borderPaddingRoundHorizontalInput.disabled = !enabledState.horizontal;
      if (borderPaddingRoundHorizontalInput.disabled) {
        borderPaddingRoundHorizontalInput.value = 'none';
      }
    }

    if (borderPaddingRoundVerticalInput) {
      borderPaddingRoundVerticalInput.disabled = !enabledState.vertical;
      if (borderPaddingRoundVerticalInput.disabled) {
        borderPaddingRoundVerticalInput.value = 'none';
      }
    }
  }

  function updateImageBorderSlotInputsState(isImageModeActive) {
    const {
      imageBorderCornerButtons,
      imageBorderSideButtons,
      imageBorderTransformInputs,
    } = elements;

    [
      ...Object.values(imageBorderCornerButtons),
      ...Object.values(imageBorderSideButtons),
    ].forEach((input) => {
      if (input) {
        input.disabled = !isImageModeActive;
      }
    });

    Object.values(imageBorderTransformInputs).forEach((group) => {
      Object.values(group).forEach((controls) => {
        controls.rotation.disabled = !isImageModeActive;
        controls.flipX.disabled = !isImageModeActive;
        controls.flipY.disabled = !isImageModeActive;
        controls.clear.disabled = !isImageModeActive;
      });
    });
  }

  function updateBorderColorModeUI() {
    const {
      borderToggle,
      borderColorInput,
      borderBackgroundColorInput,
      borderBackgroundColorSolidRadio,
      insideOutAddColorButton,
      insideOutColors,
      imageBorderControls,
      imageBorderSizingModeInput,
      imageBorderRepeatModeInput,
    } = elements;

    const isBorderEnabled = borderToggle.checked;
    const selectedMode = resolveBorderColorMode();
    const solidModeActive = selectedMode === 'solid' && isBorderEnabled;
    const showInsideOutColors = selectedMode === 'inside-out' && isBorderEnabled;
    const showImageControls = selectedMode === 'images' && isBorderEnabled;

    borderColorInput.disabled = !solidModeActive;
    borderBackgroundColorInput.disabled = !(borderBackgroundColorSolidRadio.checked && isBorderEnabled);
    actions.syncColorPreviewButtons();
    insideOutAddColorButton.disabled = !showInsideOutColors;
    insideOutColors.classList.toggle('hidden', !showInsideOutColors);
    imageBorderControls?.classList.toggle('hidden', !showImageControls);

    if (imageBorderSizingModeInput) {
      imageBorderSizingModeInput.disabled = !showImageControls;
    }

    if (imageBorderRepeatModeInput) {
      imageBorderRepeatModeInput.disabled = !showImageControls;
    }

    updatePaddingRoundingInputsState();
    updateImageBorderSlotInputsState(showImageControls);
    borderState.updateInsideOutColorRowsState();
  }

  function updateBorderControlsState() {
    const {
      borderToggle,
      borderOptions,
      centerPaddingInput,
      borderWidthInput,
      borderRadiusInput,
      borderColorSolidRadio,
      borderColorInsideOutRadio,
      borderColorImagesRadio,
      borderColorInput,
      borderBackgroundColorTransparentRadio,
      borderBackgroundColorSolidRadio,
      borderBackgroundColorInput,
      insideOutAddColorButton,
      imageBorderSizingModeInput,
      imageBorderRepeatModeInput,
      sidePaddingControls,
    } = elements;

    const enabled = borderToggle.checked;
    borderOptions.classList.toggle('hidden', !enabled);
    borderOptions.classList.toggle('disabled', !enabled);
    borderOptions.setAttribute('aria-disabled', String(!enabled));

    [
      centerPaddingInput,
      borderWidthInput,
      borderRadiusInput,
      borderColorSolidRadio,
      borderColorInsideOutRadio,
      borderColorImagesRadio,
      borderColorInput,
      borderBackgroundColorTransparentRadio,
      borderBackgroundColorSolidRadio,
      borderBackgroundColorInput,
      insideOutAddColorButton,
      imageBorderSizingModeInput,
      imageBorderRepeatModeInput,
      ...Object.values(sidePaddingControls).map((control) => control.lock),
    ].forEach((element) => {
      if (element) {
        element.disabled = !enabled;
      }
    });

    updateBorderColorModeUI();
    actions.syncLockedPaddingValues();
  }

  const baseController = createBorderController({
    elements,
    actions: {
      ...actions,
      addInsideOutColor: borderState.addInsideOutColor,
      updateBorderColorModeUI,
      updateBorderControlsState,
    },
    callbacks,
  });

  const configAdapter = createBorderConfigAdapter({
    elements,
    state,
    helpers: {
      ...helpers,
      resolveBorderColorMode,
      getInsideOutColorValues: borderState.getInsideOutColorValues,
    },
  });

  return {
    mount: baseController.mount,
    unmount: baseController.unmount,
    getBorderConfig: configAdapter.getBorderConfig,
    resolveBorderColorMode,
    updateImageBorderSlotInputsState,
    updateBorderColorModeUI,
    updateBorderControlsState,
    updatePaddingRoundingInputsState,
  };
}
