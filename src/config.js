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
    parsePaddingNumber,
  } = inputs;

  const parsePadding = parsePaddingNumber || clampToPositiveNumber;
  const centerPadding = parsePadding(centerPaddingValue, 24);
  const padding = {
    top: lockState.top ? centerPadding : parsePadding(sidePaddingValues.top, centerPadding),
    right: lockState.right ? centerPadding : parsePadding(sidePaddingValues.right, centerPadding),
    bottom: lockState.bottom ? centerPadding : parsePadding(sidePaddingValues.bottom, centerPadding),
    left: lockState.left ? centerPadding : parsePadding(sidePaddingValues.left, centerPadding),
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
    parsePaddingNumber,
  } = inputs;
  const parsePadding = parsePaddingNumber || clampToPositiveNumber;
  const centerPadding = parsePadding(centerPaddingValue, 50);

  return {
    top: lockState.top ? centerPadding : parsePadding(sidePaddingValues.top, centerPadding),
    right: lockState.right ? centerPadding : parsePadding(sidePaddingValues.right, centerPadding),
    bottom: lockState.bottom ? centerPadding : parsePadding(sidePaddingValues.bottom, centerPadding),
    left: lockState.left ? centerPadding : parsePadding(sidePaddingValues.left, centerPadding),
  };
}
