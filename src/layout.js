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
  return Math.min(maxContentWidth, widestLine);
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
  const textPadding = borderConfig.enabled
    ? borderConfig.padding
    : { top: 0, right: 0, bottom: 0, left: 0 };
  const textStartX = canvasSizePaddingConfig.left + borderWidth + textPadding.left;
  const textStartY = canvasSizePaddingConfig.top + borderWidth + textPadding.top;
  const alignmentWidth = getAlignmentWidth(laidOutLines, maxContentWidth);
  const lineStartPositions = laidOutLines.map((line) => getAlignedStartX(line.align, textStartX, alignmentWidth, line.width));
  const renderedMinX = lineStartPositions.length ? Math.min(...lineStartPositions) : textStartX;
  const renderedMaxX = laidOutLines.reduce((maxX, line, index) => Math.max(maxX, lineStartPositions[index] + line.width), renderedMinX);
  const verticalBounds = measureRenderedVerticalBounds(laidOutLines, textStartY);

  if (borderConfig.enabled) {
    const borderX = renderedMinX - textPadding.left - borderWidth / 2;
    const borderY = verticalBounds.minY - textPadding.top - borderWidth / 2;
    const borderRectWidth = renderedMaxX - renderedMinX + textPadding.left + textPadding.right + borderWidth;
    const borderRectHeight = verticalBounds.maxY - verticalBounds.minY + textPadding.top + textPadding.bottom + borderWidth;

    return {
      width: Math.max(1, Math.ceil(borderX + borderRectWidth + borderStrokeOverflow + canvasSizePaddingConfig.right)),
      height: Math.max(1, Math.ceil(borderY + borderRectHeight + borderStrokeOverflow + canvasSizePaddingConfig.bottom)),
    };
  }

  return {
    width: Math.max(1, Math.ceil(renderedMaxX + canvasSizePaddingConfig.right)),
    height: Math.max(1, Math.ceil(verticalBounds.maxY + canvasSizePaddingConfig.bottom)),
  };
}
