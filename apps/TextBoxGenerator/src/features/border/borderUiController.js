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
  };
}
