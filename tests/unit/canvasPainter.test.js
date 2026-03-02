import { describe, expect, it } from 'vitest';

import { createCanvasPainter } from '../../src/render/canvasPainter.js';

function createMockContext() {
  const lineSegments = [];
  let currentMoveTo = null;

  return {
    lineSegments,
    clearRect: () => {},
    fillRect: () => {},
    fillText: () => {},
    stroke: () => {},
    beginPath: () => {
      currentMoveTo = null;
    },
    moveTo: (x, y) => {
      currentMoveTo = { x, y };
    },
    lineTo: (x, y) => {
      lineSegments.push({ from: currentMoveTo, to: { x, y } });
    },
    measureText: () => ({
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
    }),
    set font(value) {
      this._font = value;
    },
    get font() {
      return this._font;
    },
    set fillStyle(value) {
      this._fillStyle = value;
    },
    get fillStyle() {
      return this._fillStyle;
    },
    set strokeStyle(value) {
      this._strokeStyle = value;
    },
    get strokeStyle() {
      return this._strokeStyle;
    },
    set lineWidth(value) {
      this._lineWidth = value;
    },
    get lineWidth() {
      return this._lineWidth;
    },
    textBaseline: 'top',
  };
}

describe('createCanvasPainter', () => {
  it('draws underline segments for whitespace tokens when underline is enabled', () => {
    const context = createMockContext();
    const painter = createCanvasPainter({
      context,
      canvas: { width: 400, height: 200 },
      getBackgroundRectHeightForFont: () => 12,
      drawImageBorder: () => {},
    });

    const tokenStyle = {
      underline: true,
      fontSize: 16,
      color: '#000',
      background: null,
    };

    painter.renderDocumentToCanvas(
      [{
        align: 'left',
        width: 15,
        lineHeight: 20,
        tokens: [
          { text: 'A', width: 8, style: tokenStyle, font: 'normal 400 16px sans-serif' },
          { text: ' ', width: 4, style: tokenStyle, font: 'normal 400 16px sans-serif' },
          { text: '', width: 0, style: tokenStyle, font: 'normal 400 16px sans-serif' },
          { text: 'B', width: 3, style: tokenStyle, font: 'normal 400 16px sans-serif' },
        ],
      }],
      { enabled: false, width: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      { mode: 'transparent', color: '#fff' },
      { top: 0, right: 0, bottom: 0, left: 0 },
      100,
    );

    expect(context.lineSegments).toHaveLength(3);
    expect(context.lineSegments[1].to.x - context.lineSegments[1].from.x).toBe(4);
  });
});
