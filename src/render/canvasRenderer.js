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
  const textPadding = borderConfig.enabled ? borderConfig.padding : { top: 0, right: 0, bottom: 0, left: 0 };

  const textStartX = canvasSizePaddingConfig.left + borderWidth + textPadding.left;
  const textStartY = canvasSizePaddingConfig.top + borderWidth + textPadding.top;

  const alignmentWidth = getAlignmentWidth(laidOutLines, maxContentWidth);
  const lineStartPositions = laidOutLines.map((line) => getAlignedStartX(line.align, textStartX, alignmentWidth, line.width));
  const renderedMinX = lineStartPositions.length ? Math.min(...lineStartPositions) : textStartX;
  const renderedMaxX = laidOutLines.reduce((maxX, line, index) => Math.max(maxX, lineStartPositions[index] + line.width), renderedMinX);
  const verticalBounds = measureRenderedVerticalBounds(laidOutLines, textStartY);

  let borderX = 0;
  let borderY = 0;
  let borderRectWidth = 0;
  let borderRectHeight = 0;

  if (borderConfig.enabled) {
    borderX = renderedMinX - textPadding.left - borderWidth / 2;
    borderY = verticalBounds.minY - textPadding.top - borderWidth / 2;
    borderRectWidth = renderedMaxX - renderedMinX + textPadding.left + textPadding.right + borderWidth;
    borderRectHeight = verticalBounds.maxY - verticalBounds.minY + textPadding.top + textPadding.bottom + borderWidth;

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
