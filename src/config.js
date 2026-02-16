export function getBorderConfig(inputs) {
  const {
    enabled,
    borderWidthValue,
    borderRadiusValue,
    colorMode,
    color,
    insideOutColorValues,
    backgroundMode,
    backgroundColor,
    centerPaddingValue,
    lockState,
    sidePaddingValues,
    imageBorder,
    clampToPositiveNumber,
  } = inputs;

  const centerPadding = clampToPositiveNumber(centerPaddingValue, 24);
  const padding = {
    top: lockState.top ? centerPadding : clampToPositiveNumber(sidePaddingValues.top, centerPadding),
    right: lockState.right ? centerPadding : clampToPositiveNumber(sidePaddingValues.right, centerPadding),
    bottom: lockState.bottom ? centerPadding : clampToPositiveNumber(sidePaddingValues.bottom, centerPadding),
    left: lockState.left ? centerPadding : clampToPositiveNumber(sidePaddingValues.left, centerPadding),
  };

  return {
    enabled,
    width: clampToPositiveNumber(borderWidthValue, 2),
    radius: clampToPositiveNumber(borderRadiusValue, 16),
    colorMode,
    color,
    insideOutColors: insideOutColorValues,
    imageBorder,
    backgroundMode,
    backgroundColor,
    padding,
  };
}

export function getCanvasBackgroundConfig(inputs) {
  return {
    mode: inputs.isSolidMode ? 'solid' : 'transparent',
    color: inputs.color,
  };
}

export function getCanvasSizePaddingConfig(inputs) {
  const {
    centerPaddingValue,
    lockState,
    sidePaddingValues,
    clampToPositiveNumber,
  } = inputs;
  const centerPadding = clampToPositiveNumber(centerPaddingValue, 50);

  return {
    top: lockState.top ? centerPadding : clampToPositiveNumber(sidePaddingValues.top, centerPadding),
    right: lockState.right ? centerPadding : clampToPositiveNumber(sidePaddingValues.right, centerPadding),
    bottom: lockState.bottom ? centerPadding : clampToPositiveNumber(sidePaddingValues.bottom, centerPadding),
    left: lockState.left ? centerPadding : clampToPositiveNumber(sidePaddingValues.left, centerPadding),
  };
}
