function resolveBorderColorMode({ borderColorSolidChecked, borderColorInsideOutChecked, borderColorImagesChecked }) {
  if (borderColorInsideOutChecked) {
    return 'inside-out';
  }

  if (borderColorImagesChecked) {
    return 'images';
  }

  if (borderColorSolidChecked) {
    return 'solid';
  }

  return 'solid';
}

export function getBorderConfig(inputs, dependencies) {
  const { clampToPositiveNumber } = dependencies;
  const {
    borderEnabled,
    borderWidth,
    borderRadius,
    borderColorSolidChecked,
    borderColorInsideOutChecked,
    borderColorImagesChecked,
    borderColor,
    insideOutColors,
    borderBackgroundColorSolidChecked,
    borderBackgroundColor,
    centerPadding,
    sidePaddings,
    lockState,
    imageBorder,
  } = inputs;

  const normalizedCenterPadding = clampToPositiveNumber(centerPadding, 24);

  const padding = {
    top: lockState.top ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.top, normalizedCenterPadding),
    right: lockState.right ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.right, normalizedCenterPadding),
    bottom: lockState.bottom ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.bottom, normalizedCenterPadding),
    left: lockState.left ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.left, normalizedCenterPadding),
  };

  return {
    enabled: borderEnabled,
    width: clampToPositiveNumber(borderWidth, 2),
    radius: clampToPositiveNumber(borderRadius, 16),
    colorMode: resolveBorderColorMode({
      borderColorSolidChecked,
      borderColorInsideOutChecked,
      borderColorImagesChecked,
    }),
    color: borderColor,
    insideOutColors: [...insideOutColors],
    imageBorder,
    backgroundMode: borderBackgroundColorSolidChecked ? 'solid' : 'transparent',
    backgroundColor: borderBackgroundColor,
    padding,
  };
}

export function getCanvasBackgroundConfig(inputs) {
  return {
    mode: inputs.backgroundColorSolidChecked ? 'solid' : 'transparent',
    color: inputs.backgroundColor,
  };
}

export function getCanvasSizePaddingConfig(inputs, dependencies) {
  const { clampToPositiveNumber } = dependencies;
  const {
    centerPadding,
    sidePaddings,
    lockState,
  } = inputs;

  const normalizedCenterPadding = clampToPositiveNumber(centerPadding, 50);

  return {
    top: lockState.top ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.top, normalizedCenterPadding),
    right: lockState.right ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.right, normalizedCenterPadding),
    bottom: lockState.bottom ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.bottom, normalizedCenterPadding),
    left: lockState.left ? normalizedCenterPadding : clampToPositiveNumber(sidePaddings.left, normalizedCenterPadding),
  };
}
