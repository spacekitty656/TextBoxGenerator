export function tokenizeText(text) {
  const parts = text.match(/\S+|\s+/g);
  return parts || [''];
}

export function layoutDocumentForCanvas(lines, maxWidth, wrapEnabled, dependencies) {
  const {
    getCanvasStyle,
    buildCanvasFont,
    measureText,
    defaultFontSize,
  } = dependencies;
  const laidOutLines = [];

  lines.forEach((line) => {
    let currentTokens = [];
    let currentWidth = 0;
    let maxFontSizeInLine = defaultFontSize;

    const pushCurrentLine = () => {
      if (currentTokens.length === 0) {
        return;
      }

      laidOutLines.push({
        align: line.align || 'left',
        tokens: [...currentTokens],
        width: currentWidth,
        lineHeight: Math.round(maxFontSizeInLine * 1.35),
      });

      currentTokens = [];
      currentWidth = 0;
      maxFontSizeInLine = defaultFontSize;
    };

    line.runs.forEach((run) => {
      const style = getCanvasStyle(run.attributes);
      const font = buildCanvasFont(style);
      const tokens = tokenizeText(run.text);

      tokens.forEach((tokenText) => {
        const tokenWidth = measureText(tokenText, font);

        if (wrapEnabled && currentWidth + tokenWidth > maxWidth && currentTokens.length > 0 && tokenText.trim()) {
          pushCurrentLine();
        }

        currentTokens.push({
          text: tokenText,
          style,
          font,
          width: tokenWidth,
        });

        currentWidth += tokenWidth;
        maxFontSizeInLine = Math.max(maxFontSizeInLine, style.fontSize);
      });
    });

    pushCurrentLine();

    if (line.runs.length === 0) {
      laidOutLines.push({
        align: line.align || 'left',
        tokens: [],
        width: 0,
        lineHeight: Math.round(defaultFontSize * 1.35),
      });
    }
  });

  return laidOutLines;
}

export function getAlignedStartX(align, startX, maxWidth, lineWidth) {
  if (align === 'center') {
    return startX + (maxWidth - lineWidth) / 2;
  }

  if (align === 'right') {
    return startX + (maxWidth - lineWidth);
  }

  return startX;
}

export function getAlignmentWidth(laidOutLines, maxContentWidth) {
  const widestLine = laidOutLines.reduce((maxWidth, line) => Math.max(maxWidth, line.width || 0), 0);
  return Math.max(maxContentWidth, widestLine);
}


function roundLengthToMode(length, tileLength, mode) {
  if (mode === 'up') {
    return Math.ceil(length / tileLength) * tileLength;
  }

  if (mode === 'down') {
    return Math.floor(length / tileLength) * tileLength;
  }

  if (mode === 'nearest') {
    return Math.round(length / tileLength) * tileLength;
  }

  return length;
}

function resolveRoundedPadding(borderConfig, contentWidth, contentHeight) {
  const basePadding = borderConfig.padding;
  const imageBorder = borderConfig.imageBorder || {};
  const sideMode = imageBorder.sideMode;
  const colorMode = borderConfig.colorMode;
  const horizontalMode = borderConfig.paddingRounding?.horizontal || 'none';
  const verticalMode = borderConfig.paddingRounding?.vertical || 'none';

  if (colorMode !== 'images' || sideMode !== 'repeat') {
    return basePadding;
  }

  const roundedPadding = { ...basePadding };
  const topWidth = imageBorder?.sides?.top?.image?.width || imageBorder?.sides?.top?.image?.naturalWidth || 0;
  const bottomWidth = imageBorder?.sides?.bottom?.image?.width || imageBorder?.sides?.bottom?.image?.naturalWidth || 0;
  const leftHeight = imageBorder?.sides?.left?.image?.height || imageBorder?.sides?.left?.image?.naturalHeight || 0;
  const rightHeight = imageBorder?.sides?.right?.image?.height || imageBorder?.sides?.right?.image?.naturalHeight || 0;

  if (horizontalMode !== 'none' && topWidth > 0 && topWidth === bottomWidth) {
    const borderRectWidth = contentWidth + basePadding.left + basePadding.right + borderConfig.width;
    const roundedWidth = roundLengthToMode(borderRectWidth, topWidth, horizontalMode);
    roundedPadding.right = Math.max(0, basePadding.right + (roundedWidth - borderRectWidth));
  }

  if (verticalMode !== 'none' && leftHeight > 0 && leftHeight === rightHeight) {
    const borderRectHeight = contentHeight + basePadding.top + basePadding.bottom + borderConfig.width;
    const roundedHeight = roundLengthToMode(borderRectHeight, leftHeight, verticalMode);
    roundedPadding.bottom = Math.max(0, basePadding.bottom + (roundedHeight - borderRectHeight));
  }

  return roundedPadding;
}

export function calculateCanvasDimensions(
  laidOutLines,
  borderConfig,
  canvasSizePaddingConfig,
  maxContentWidth,
  dependencies,
) {
  const {
    measureRenderedVerticalBounds,
  } = dependencies;
  const borderWidth = borderConfig.enabled ? borderConfig.width : 0;
  const borderStrokeOverflow = borderConfig.enabled ? borderWidth / 2 : 0;
  const baseTextPadding = borderConfig.enabled
    ? borderConfig.padding
    : { top: 0, right: 0, bottom: 0, left: 0 };
  const textStartX = canvasSizePaddingConfig.left + borderWidth + baseTextPadding.left;
  const textStartY = canvasSizePaddingConfig.top + borderWidth + baseTextPadding.top;
  const alignmentWidth = getAlignmentWidth(laidOutLines, maxContentWidth);
  const lineStartPositions = laidOutLines.map((line) => getAlignedStartX(line.align, textStartX, alignmentWidth, line.width));
  const renderedMinX = lineStartPositions.length ? Math.min(...lineStartPositions) : textStartX;
  const renderedMaxX = laidOutLines.reduce((maxX, line, index) => Math.max(maxX, lineStartPositions[index] + line.width), renderedMinX);
  const hasNonLeftAlignment = laidOutLines.some((line) => line.align === 'center' || line.align === 'right');
  const contentMinX = hasNonLeftAlignment ? Math.min(renderedMinX, textStartX) : renderedMinX;
  const contentMaxX = hasNonLeftAlignment ? Math.max(renderedMaxX, textStartX + alignmentWidth) : renderedMaxX;
  const verticalBounds = measureRenderedVerticalBounds(laidOutLines, textStartY);

  if (borderConfig.enabled) {
    const contentWidth = contentMaxX - contentMinX;
    const contentHeight = verticalBounds.maxY - verticalBounds.minY;
    const textPadding = resolveRoundedPadding(borderConfig, contentWidth, contentHeight);
    const borderX = contentMinX - textPadding.left - borderWidth / 2;
    const borderY = verticalBounds.minY - textPadding.top - borderWidth / 2;
    const borderRectWidth = contentWidth + textPadding.left + textPadding.right + borderWidth;
    const borderRectHeight = contentHeight + textPadding.top + textPadding.bottom + borderWidth;

    return {
      width: Math.max(1, Math.ceil(borderX + borderRectWidth + borderStrokeOverflow + canvasSizePaddingConfig.right)),
      height: Math.max(1, Math.ceil(borderY + borderRectHeight + borderStrokeOverflow + canvasSizePaddingConfig.bottom)),
    };
  }

  return {
    width: Math.max(1, Math.ceil(contentMaxX + canvasSizePaddingConfig.right)),
    height: Math.max(1, Math.ceil(verticalBounds.maxY + canvasSizePaddingConfig.bottom)),
  };
}
