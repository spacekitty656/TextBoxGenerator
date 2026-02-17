import { describe, expect, it } from 'vitest';

import { calculateCanvasDimensions } from '../../src/layout.js';

describe('calculateCanvasDimensions', () => {
  it('keeps border width anchored to configured content width for centered text', () => {
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
    // left canvas padding + border width + left text padding + content width + right text padding + border width + right canvas padding
    // 50 + 4 + 20 + 300 + 20 + 4 + 50 = 448
    expect(dimensions.width).toBe(448);
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
