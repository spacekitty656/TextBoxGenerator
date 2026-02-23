import {
  layoutDocumentForCanvas as layoutDocumentForCanvasFromRenderer,
  calculateCanvasDimensions as calculateCanvasDimensionsFromRenderer,
} from './canvasRenderer.js';

export const FONT_MAP = {
  sansserif: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  monospace: '"Courier New", Courier, monospace',
  pressstart2p: '"Press Start 2P", "Courier New", monospace',
};


export function registerCanvasFontFamily(fontValue, fontFamily) {
  if (!fontValue || !fontFamily) {
    return;
  }

  FONT_MAP[fontValue] = fontFamily;
}

const SIZE_MAP = {
  small: 14,
  normal: 18,
  large: 24,
  huge: 32,
};

const DEFAULT_STYLE = {
  bold: false,
  italic: false,
  underline: false,
  color: '#111827',
  background: null,
  font: 'sansserif',
  size: 'normal',
};

export function getCanvasStyle(attributes = {}) {
  const merged = { ...DEFAULT_STYLE, ...attributes };
  const fontSize = SIZE_MAP[merged.size] || Number.parseInt(merged.size, 10) || SIZE_MAP.normal;
  const fontFamily = FONT_MAP[merged.font] || merged.font || FONT_MAP.sansserif;

  return {
    bold: Boolean(merged.bold),
    italic: Boolean(merged.italic),
    underline: Boolean(merged.underline),
    color: merged.color || DEFAULT_STYLE.color,
    background: typeof merged.background === 'string' && merged.background.trim() ? merged.background : null,
    fontSize,
    fontFamily,
  };
}

export function buildCanvasFont(style) {
  const segments = [];

  if (style.italic) {
    segments.push('italic');
  }

  if (style.bold) {
    segments.push('700');
  }

  segments.push(`${style.fontSize}px`);
  segments.push(style.fontFamily);

  return segments.join(' ');
}

export function createBackgroundRectHeightForFont({ context }) {
  const backgroundMetricsHeightCache = new Map();

  return function getBackgroundRectHeightForFont(font, fallbackFontSize) {
    if (backgroundMetricsHeightCache.has(font)) {
      return backgroundMetricsHeightCache.get(font);
    }

    context.font = font;
    const metrics = context.measureText('Mg');
    const actualAscent = metrics.actualBoundingBoxAscent ?? fallbackFontSize * 0.8;
    const actualDescent = metrics.actualBoundingBoxDescent ?? fallbackFontSize * 0.2;
    const height = Math.max(1, actualAscent + actualDescent);
    backgroundMetricsHeightCache.set(font, height);
    return height;
  };
}

export function createLayoutAdapter({ context, measureRenderedVerticalBounds }) {
  function layoutDocumentForCanvas(lines, maxWidth, wrapEnabled) {
    return layoutDocumentForCanvasFromRenderer(lines, maxWidth, wrapEnabled, {
      getCanvasStyle,
      buildCanvasFont,
      defaultFontSize: SIZE_MAP.normal,
      measureText: (textValue, font) => {
        context.font = font;
        return context.measureText(textValue).width;
      },
    });
  }

  function calculateCanvasDimensions(laidOutLines, borderConfig, canvasSizePaddingConfig, maxContentWidth) {
    return calculateCanvasDimensionsFromRenderer(
      laidOutLines,
      borderConfig,
      canvasSizePaddingConfig,
      maxContentWidth,
      { measureRenderedVerticalBounds },
    );
  }

  return {
    layoutDocumentForCanvas,
    calculateCanvasDimensions,
  };
}
