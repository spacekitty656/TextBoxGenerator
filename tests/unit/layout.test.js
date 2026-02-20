import { describe, expect, it } from 'vitest';

import {
  calculateCanvasDimensions,
  getAlignedStartX,
  getAlignmentWidth,
  layoutDocumentForCanvas,
  tokenizeText,
} from '../../src/layout.js';

describe('tokenizeText', () => {
  it('splits mixed words, spaces, and newlines into stable tokens', () => {
    expect(tokenizeText('Hello  world\nnext\tline')).toEqual([
      'Hello',
      '  ',
      'world',
      '\n',
      'next',
      '\t',
      'line',
    ]);
  });

  it('returns a single all-whitespace token for all-whitespace input', () => {
    expect(tokenizeText('  \n\t  ')).toEqual(['  \n\t  ']);
  });

  it('falls back to an empty token for empty string input', () => {
    expect(tokenizeText('')).toEqual(['']);
  });
});

describe('layoutDocumentForCanvas', () => {
  const buildDeps = ({ defaultFontSize = 10, tokenWidths = {} } = {}) => ({
    defaultFontSize,
    getCanvasStyle: (attributes = {}) => ({
      fontSize: attributes.fontSize ?? defaultFontSize,
      fontWeight: attributes.bold ? 700 : 400,
      fontStyle: attributes.italic ? 'italic' : 'normal',
      fontFamily: 'UnitTestSans',
    }),
    buildCanvasFont: (style) => `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`,
    measureText: (text) => tokenWidths[text] ?? text.length,
  });

  it('wraps on token boundaries only when wrapping is enabled', () => {
    const lines = [
      {
        align: 'left',
        runs: [
          { text: 'Hello world again', attributes: {} },
        ],
      },
    ];
    const deps = buildDeps({
      tokenWidths: {
        Hello: 5,
        ' ': 1,
        world: 5,
        again: 5,
      },
    });

    const wrapped = layoutDocumentForCanvas(lines, 10, true, deps);
    const unwrapped = layoutDocumentForCanvas(lines, 10, false, deps);

    expect(wrapped).toHaveLength(3);
    expect(wrapped[0].tokens.map((token) => token.text)).toEqual(['Hello', ' ']);
    expect(wrapped[1].tokens.map((token) => token.text)).toEqual(['world', ' ']);
    expect(wrapped[2].tokens.map((token) => token.text)).toEqual(['again']);
    expect(wrapped[0].width).toBe(6);
    expect(wrapped[1].width).toBe(6);
    expect(wrapped[2].width).toBe(5);

    expect(unwrapped).toHaveLength(1);
    expect(unwrapped[0].tokens.map((token) => token.text)).toEqual(['Hello', ' ', 'world', ' ', 'again']);
    expect(unwrapped[0].width).toBe(17);
  });

  it('preserves explicit empty lines when line.runs is empty', () => {
    const laidOut = layoutDocumentForCanvas(
      [{ align: 'center', runs: [] }],
      120,
      true,
      buildDeps({ defaultFontSize: 10 }),
    );

    expect(laidOut).toEqual([
      {
        align: 'center',
        tokens: [],
        width: 0,
        lineHeight: 14,
      },
    ]);
  });

  it('sets lineHeight from the maximum font size in a line', () => {
    const laidOut = layoutDocumentForCanvas(
      [{
        align: 'left',
        runs: [
          { text: 'small', attributes: { fontSize: 12 } },
          { text: 'BIG', attributes: { fontSize: 20 } },
        ],
      }],
      999,
      false,
      buildDeps({ defaultFontSize: 10 }),
    );

    expect(laidOut).toHaveLength(1);
    expect(laidOut[0].lineHeight).toBe(Math.round(20 * 1.35));
  });
});

describe('getAlignedStartX', () => {
  it('returns deterministic start positions for left/center/right', () => {
    expect(getAlignedStartX('left', 10, 100, 40)).toBe(10);
    expect(getAlignedStartX('center', 10, 100, 40)).toBe(40);
    expect(getAlignedStartX('right', 10, 100, 40)).toBe(70);
  });
});

describe('getAlignmentWidth', () => {
  it('selects the widest laid out line when under maxContentWidth', () => {
    const lines = [
      { width: 40 },
      { width: 120 },
      { width: 75 },
    ];

    expect(getAlignmentWidth(lines, 200)).toBe(120);
  });

  it('clamps widest line width to maxContentWidth', () => {
    const lines = [
      { width: 80 },
      { width: 180 },
    ];

    expect(getAlignmentWidth(lines, 150)).toBe(150);
  });
});

describe('calculateCanvasDimensions', () => {
  it('sizes border to rendered centered content width plus padding', () => {
    const laidOutLines = [
      {
        align: 'center',
        tokens: [],
        width: 100,
        lineHeight: 20,
      },
    ];

    const borderConfig = {
      enabled: true,
      width: 4,
      padding: { top: 10, right: 20, bottom: 10, left: 20 },
    };

    const canvasSizePaddingConfig = {
      top: 30,
      right: 50,
      bottom: 30,
      left: 50,
    };

    const maxContentWidth = 300;

    const dimensions = calculateCanvasDimensions(
      laidOutLines,
      borderConfig,
      canvasSizePaddingConfig,
      maxContentWidth,
      {
        measureRenderedVerticalBounds: () => ({ minY: 44, maxY: 64 }),
      },
    );

    // Expected canvas width:
    // left canvas padding + border width + left text padding + rendered content width + right text padding + border width + right canvas padding
    // 50 + 4 + 20 + 100 + 20 + 4 + 50 = 248
    expect(dimensions.width).toBe(248);
  });


  it('treats image borders as fully outside the content when padding is zero', () => {
    const dimensions = calculateCanvasDimensions(
      [{ align: 'left', tokens: [], width: 100, lineHeight: 20 }],
      {
        enabled: true,
        colorMode: 'images',
        width: 6,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      { top: 0, right: 0, bottom: 0, left: 0 },
      200,
      {
        measureRenderedVerticalBounds: () => ({ minY: 0, maxY: 20 }),
      },
    );

    expect(dimensions.width).toBe(112);
  });


  it('avoids an extra trailing pixel from floating-point precision noise', () => {
    const dimensions = calculateCanvasDimensions(
      [{ align: 'left', tokens: [], width: 100.0000000001, lineHeight: 20 }],
      {
        enabled: true,
        colorMode: 'images',
        width: 6,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      { top: 0, right: 0, bottom: 0, left: 0 },
      200,
      {
        measureRenderedVerticalBounds: () => ({ minY: 0, maxY: 20.0000000001 }),
      },
    );

    expect(dimensions.width).toBe(112);
    expect(dimensions.height).toBe(26);
  });

  it('still expands to rendered text width when border is disabled', () => {
    const dimensions = calculateCanvasDimensions(
      [{ align: 'center', tokens: [], width: 260, lineHeight: 20 }],
      { enabled: false, width: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      { top: 10, right: 20, bottom: 10, left: 10 },
      200,
      {
        measureRenderedVerticalBounds: () => ({ minY: 10, maxY: 30 }),
      },
    );

    expect(dimensions.width).toBe(260);
  });
});
