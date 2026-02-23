import { describe, expect, it } from 'vitest';

import {
  buildCanvasFont,
  createBackgroundRectHeightForFont,
  createLayoutAdapter,
  getCanvasStyle,
} from '../../src/render/layoutAdapter.js';

describe('getCanvasStyle', () => {
  it('maps quill style attributes to canvas style with defaults', () => {
    expect(getCanvasStyle()).toEqual({
      bold: false,
      italic: false,
      underline: false,
      color: '#111827',
      background: null,
      fontSize: 18,
      fontFamily: 'Arial, Helvetica, sans-serif',
    });

    expect(getCanvasStyle({
      bold: true,
      italic: true,
      underline: true,
      color: '#ffffff',
      background: ' #000000 ',
      font: 'serif',
      size: 'huge',
    })).toEqual({
      bold: true,
      italic: true,
      underline: true,
      color: '#ffffff',
      background: ' #000000 ',
      fontSize: 32,
      fontFamily: 'Georgia, "Times New Roman", serif',
    });
  });
});

describe('buildCanvasFont', () => {
  it('builds a deterministic canvas font string', () => {
    expect(buildCanvasFont({
      italic: true,
      bold: true,
      fontSize: 24,
      fontFamily: 'Unit Test Sans',
    })).toBe('italic 700 24px Unit Test Sans');
  });
});

describe('createBackgroundRectHeightForFont', () => {
  it('measures once per font and reuses cached value', () => {
    const context = {
      font: '',
      measureTextCalls: 0,
      measureText() {
        this.measureTextCalls += 1;
        return { actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 };
      },
    };

    const getBackgroundRectHeightForFont = createBackgroundRectHeightForFont({ context });

    expect(getBackgroundRectHeightForFont('700 18px Unit Test Sans', 18)).toBe(10);
    expect(getBackgroundRectHeightForFont('700 18px Unit Test Sans', 18)).toBe(10);
    expect(context.measureTextCalls).toBe(1);
  });
});

describe('createLayoutAdapter', () => {
  it('exposes layout and dimension adapters with narrow API', () => {
    const context = {
      font: '',
      measureText: (value) => ({ width: value.length * 4 }),
    };

    const layoutAdapter = createLayoutAdapter({
      context,
      measureRenderedVerticalBounds: () => ({ minY: 20, maxY: 40 }),
    });

    const laidOut = layoutAdapter.layoutDocumentForCanvas(
      [{ align: 'left', runs: [{ text: 'ab', attributes: {} }] }],
      100,
      true,
    );

    expect(laidOut).toHaveLength(1);
    expect(laidOut[0].width).toBe(8);

    const dimensions = layoutAdapter.calculateCanvasDimensions(
      laidOut,
      { enabled: false, width: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      { top: 10, right: 10, bottom: 10, left: 10 },
      100,
    );

    expect(dimensions).toEqual({ width: 28, height: 50 });
  });
});
