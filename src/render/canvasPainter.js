import { getAlignedStartX, getAlignmentWidth } from '../layout.js';

export function createCanvasPainter({ context, canvas, getBackgroundRectHeightForFont, drawImageBorder }) {
  function drawRoundedRectPath(x, y, width, height, radius) {
    const cappedRadius = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(x + cappedRadius, y);
    context.lineTo(x + width - cappedRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + cappedRadius);
    context.lineTo(x + width, y + height - cappedRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - cappedRadius, y + height);
    context.lineTo(x + cappedRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - cappedRadius);
    context.lineTo(x, y + cappedRadius);
    context.quadraticCurveTo(x, y, x + cappedRadius, y);
    context.closePath();
  }

  function measureRenderedVerticalBounds(laidOutLines, textStartY, fallbackFontSize = 16) {
    let renderedMinY = Number.POSITIVE_INFINITY;
    let renderedMaxY = Number.NEGATIVE_INFINITY;
    let y = textStartY;

    laidOutLines.forEach((line) => {
      line.tokens.forEach((token) => {
        const metricsSource = token.text.trim() ? token.text : 'M';
        context.font = token.font;
        const textMetrics = context.measureText(metricsSource);
        const actualAscent = textMetrics.actualBoundingBoxAscent ?? token.style.fontSize * 0.8;
        const actualDescent = textMetrics.actualBoundingBoxDescent ?? token.style.fontSize * 0.2;
        const glyphTop = y;
        const glyphBottom = y + actualAscent + actualDescent;

        renderedMinY = Math.min(renderedMinY, glyphTop);
        renderedMaxY = Math.max(renderedMaxY, glyphBottom);

        if (token.style.underline && token.text.trim()) {
          const underlineY = y + token.style.fontSize + 2;
          const underlineWidth = Math.max(1, token.style.fontSize / 14);
          renderedMaxY = Math.max(renderedMaxY, underlineY + underlineWidth / 2);
        }
      });

      y += line.lineHeight;
    });

    if (!Number.isFinite(renderedMinY) || !Number.isFinite(renderedMaxY)) {
      return {
        minY: textStartY,
        maxY: textStartY + fallbackFontSize,
      };
    }

    return {
      minY: renderedMinY,
      maxY: renderedMaxY,
    };
  }

  function renderDocumentToCanvas(laidOutLines, borderConfig, canvasBackgroundConfig, canvasSizePaddingConfig, maxContentWidth) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (canvasBackgroundConfig.mode === 'solid') {
      context.fillStyle = canvasBackgroundConfig.color;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.textBaseline = 'top';

    const borderWidth = borderConfig.enabled ? borderConfig.width : 0;
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
        drawRoundedRectPath(
          borderX + fillInset,
          borderY + fillInset,
          borderRectWidth - borderWidth,
          borderRectHeight - borderWidth,
          Math.max(0, borderConfig.radius - fillInset),
        );
        context.fill();
      }
    }

    if (borderConfig.enabled && borderWidth > 0) {
      switch (borderConfig.colorMode) {
        case 'inside-out': {
          const palette = borderConfig.insideOutColors.filter((color) => typeof color === 'string' && color.length > 0);
          const segmentCount = Math.max(1, palette.length);
          const segmentWidth = borderWidth / segmentCount;

          const innerInset = borderWidth / 2;

          for (let drawIndex = segmentCount - 1; drawIndex >= 0; drawIndex -= 1) {
            const strokeWidth = (drawIndex + 1) * segmentWidth;
            const centerInset = innerInset - (strokeWidth / 2);
            context.lineWidth = strokeWidth;
            context.strokeStyle = palette[drawIndex] || borderConfig.color;
            drawRoundedRectPath(
              borderX + centerInset,
              borderY + centerInset,
              borderRectWidth - (centerInset * 2),
              borderRectHeight - (centerInset * 2),
              Math.max(0, borderConfig.radius - centerInset),
            );
            context.stroke();
          }
          break;
        }
        case 'images':
          drawImageBorder(borderConfig, borderX, borderY, borderRectWidth, borderRectHeight, drawRoundedRectPath);
          break;
        case 'solid':
        default:
          context.lineWidth = borderWidth;
          context.strokeStyle = borderConfig.color;
          drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
          context.stroke();
          break;
      }
    }

    let y = textStartY;
    laidOutLines.forEach((line, index) => {
      const startX = lineStartPositions[index];

      let backgroundX = startX;
      let activeBackgroundColor = null;
      let activeBackgroundFont = null;
      let activeBackgroundStartX = 0;
      let activeBackgroundWidth = 0;
      let activeBackgroundHeight = 0;

      const flushActiveBackground = () => {
        if (!activeBackgroundColor || activeBackgroundWidth <= 0) {
          return;
        }

        const rectStartX = Math.floor(activeBackgroundStartX);
        const rectEndX = Math.ceil(activeBackgroundStartX + activeBackgroundWidth);
        const rectWidth = Math.max(1, rectEndX - rectStartX);

        context.fillStyle = activeBackgroundColor;
        context.fillRect(rectStartX, y, rectWidth, activeBackgroundHeight);
      };

      line.tokens.forEach((token) => {
        const hasBackground = Boolean(token.style.background && token.text.length > 0);

        if (hasBackground) {
          const tokenBackgroundHeight = getBackgroundRectHeightForFont(token.font, token.style.fontSize);

          if (activeBackgroundColor === token.style.background && activeBackgroundFont === token.font) {
            activeBackgroundWidth += token.width;
            activeBackgroundHeight = Math.max(activeBackgroundHeight, tokenBackgroundHeight);
          } else {
            flushActiveBackground();
            activeBackgroundColor = token.style.background;
            activeBackgroundFont = token.font;
            activeBackgroundStartX = backgroundX;
            activeBackgroundWidth = token.width;
            activeBackgroundHeight = tokenBackgroundHeight;
          }
        } else {
          flushActiveBackground();
          activeBackgroundColor = null;
          activeBackgroundFont = null;
          activeBackgroundStartX = 0;
          activeBackgroundWidth = 0;
          activeBackgroundHeight = 0;
        }

        backgroundX += token.width;
      });

      flushActiveBackground();

      let x = startX;

      line.tokens.forEach((token) => {
        context.font = token.font;
        context.fillStyle = token.style.color;
        context.fillText(token.text, x, y);

        if (token.style.underline && token.text.trim()) {
          const underlineY = y + token.style.fontSize + 2;
          const underlineWidth = Math.max(1, token.style.fontSize / 14);
          context.strokeStyle = token.style.color;
          context.lineWidth = underlineWidth;
          context.beginPath();
          context.moveTo(x, underlineY);
          context.lineTo(x + token.width, underlineY);
          context.stroke();
        }

        x += token.width;
      });

      y += line.lineHeight;
    });
  }

  function paintDocument({ laidOutLines, borderConfig, canvasBackgroundConfig, canvasSizePaddingConfig, maxContentWidth }) {
    renderDocumentToCanvas(laidOutLines, borderConfig, canvasBackgroundConfig, canvasSizePaddingConfig, maxContentWidth);
  }

  return {
    drawRoundedRectPath,
    measureRenderedVerticalBounds,
    renderDocumentToCanvas,
    paintDocument,
  };
}
