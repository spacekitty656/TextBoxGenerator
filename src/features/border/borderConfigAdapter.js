import { getBorderConfig as getBorderConfigFromModule } from '../../config.js';

export function createBorderConfigAdapter({ elements, state, helpers }) {
  function getBorderConfig() {
    const {
      borderToggle,
      borderWidthInput,
      borderRadiusInput,
      borderColorInput,
      borderBackgroundColorSolidRadio,
      borderBackgroundColorInput,
      centerPaddingInput,
      sidePaddingControls,
      imageBorderSizingModeInput,
      imageBorderRepeatModeInput,
      borderPaddingRoundHorizontalInput,
      borderPaddingRoundVerticalInput,
    } = elements;

    const {
      lockState,
      imageBorderState,
    } = state;

    const {
      resolveBorderColorMode,
      getInsideOutColorValues,
      resolveRenderableImageBorderGroup,
      getManagedImageById,
      clampToPositiveNumber,
      parsePaddingNumber,
    } = helpers;

    return getBorderConfigFromModule({
      enabled: borderToggle.checked,
      borderWidthValue: borderWidthInput.value,
      borderRadiusValue: borderRadiusInput.value,
      colorMode: resolveBorderColorMode(),
      color: borderColorInput.value,
      insideOutColorValues: getInsideOutColorValues(),
      backgroundMode: borderBackgroundColorSolidRadio.checked ? 'solid' : 'transparent',
      backgroundColor: borderBackgroundColorInput.value,
      centerPaddingValue: centerPaddingInput.value,
      lockState,
      sidePaddingValues: {
        top: sidePaddingControls.top.input.value,
        right: sidePaddingControls.right.input.value,
        bottom: sidePaddingControls.bottom.input.value,
        left: sidePaddingControls.left.input.value,
      },
      imageBorder: {
        corners: resolveRenderableImageBorderGroup(imageBorderState.corners, getManagedImageById),
        sides: resolveRenderableImageBorderGroup(imageBorderState.sides, getManagedImageById),
        sizingStrategy: imageBorderSizingModeInput?.value || 'auto',
        sideMode: imageBorderRepeatModeInput?.value || 'stretch',
      },
      paddingRounding: {
        horizontal: borderPaddingRoundHorizontalInput?.value || 'none',
        vertical: borderPaddingRoundVerticalInput?.value || 'none',
      },
      clampToPositiveNumber,
      parsePaddingNumber,
    });
  }

  return { getBorderConfig };
}
