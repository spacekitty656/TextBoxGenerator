import {
  calculateCanvasDimensions as calculateCanvasDimensionsFromModule,
  getAlignedStartX,
  getAlignmentWidth,
  layoutDocumentForCanvas as layoutDocumentForCanvasFromModule,
} from '../layout.js';

export function layoutDocumentForCanvas(lines, maxWidth, wrapEnabled, deps) {
  return layoutDocumentForCanvasFromModule(lines, maxWidth, wrapEnabled, deps);
}

export function calculateCanvasDimensions(laidOutLines, borderConfig, canvasSizePaddingConfig, maxContentWidth, deps) {
  return calculateCanvasDimensionsFromModule(
    laidOutLines,
    borderConfig,
    canvasSizePaddingConfig,
    maxContentWidth,
    deps,
  );
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

export function renderDocumentToCanvas({
  context,
  canvas,
  laidOutLines,
  borderConfig,
  canvasBackgroundConfig,
  canvasSizePaddingConfig,
  maxContentWidth,
  measureRenderedVerticalBounds,
  drawRoundedRectPath,
  drawImageBorder,
}) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (canvasBackgroundConfig.mode === 'solid') {
    context.fillStyle = canvasBackgroundConfig.color;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.textBaseline = 'top';

  const borderWidth = borderConfig.enabled ? borderConfig.width : 0;
  const baseTextPadding = borderConfig.enabled ? borderConfig.padding : { top: 0, right: 0, bottom: 0, left: 0 };

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

  let borderX = 0;
  let borderY = 0;
  let borderRectWidth = 0;
  let borderRectHeight = 0;

  if (borderConfig.enabled) {
    const contentWidth = contentMaxX - contentMinX;
    const contentHeight = verticalBounds.maxY - verticalBounds.minY;
    const textPadding = resolveRoundedPadding(borderConfig, contentWidth, contentHeight);
    borderX = contentMinX - textPadding.left - borderWidth / 2;
    borderY = verticalBounds.minY - textPadding.top - borderWidth / 2;
    borderRectWidth = contentWidth + textPadding.left + textPadding.right + borderWidth;
    borderRectHeight = contentHeight + textPadding.top + textPadding.bottom + borderWidth;

    if (borderConfig.backgroundMode === 'solid') {
      const fillInset = borderWidth / 2;
      context.fillStyle = borderConfig.backgroundColor;
      drawRoundedRectPath(borderX + fillInset, borderY + fillInset, borderRectWidth - borderWidth, borderRectHeight - borderWidth, Math.max(0, borderConfig.radius - fillInset));
      context.fill();
    }
  }

  if (borderConfig.enabled && borderWidth > 0) {
    if (borderConfig.colorMode === 'images') {
      drawImageBorder(borderConfig, borderX, borderY, borderRectWidth, borderRectHeight);
    } else if (borderConfig.colorMode === 'inside-out') {
      const palette = borderConfig.insideOutColors.filter((color) => typeof color === 'string' && color.length > 0);
      const segmentCount = Math.max(1, palette.length);
      const segmentWidth = borderWidth / segmentCount;
      const innerInset = borderWidth / 2;

      for (let drawIndex = segmentCount - 1; drawIndex >= 0; drawIndex -= 1) {
        const strokeWidth = (drawIndex + 1) * segmentWidth;
        const centerInset = innerInset - (strokeWidth / 2);
        context.lineWidth = strokeWidth;
        context.strokeStyle = palette[drawIndex] || borderConfig.color;
        drawRoundedRectPath(borderX + centerInset, borderY + centerInset, borderRectWidth - (centerInset * 2), borderRectHeight - (centerInset * 2), Math.max(0, borderConfig.radius - centerInset));
        context.stroke();
      }
    } else {
      context.lineWidth = borderWidth;
      context.strokeStyle = borderConfig.color;
      drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
      context.stroke();
    }
  }

  return { textStartX, textStartY, lineStartPositions };
}
