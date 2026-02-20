import { describe, expect, it } from 'vitest';

import { drawSideImage } from '../../src/border/imageBorder.js';

describe('drawSideImage repeat mode', () => {
  it('draws full-sized tiles and truncates overflow via clipping instead of compressing final tile', () => {
    const drawCalls = [];
    const context = {
      save: () => {},
      beginPath: () => {},
      rect: () => {},
      clip: () => {},
      restore: () => {},
      drawImage: (...args) => drawCalls.push(args),
    };

    const image = { width: 10, height: 4 };
    const result = drawSideImage({
      context,
      slot: { status: 'ready', image },
      x: 0,
      y: 0,
      width: 25,
      height: 5,
      orientation: 'horizontal',
      sideMode: 'repeat',
    });

    expect(result).toBe(true);
    expect(drawCalls).toHaveLength(3);

    // 25px area with 10px tiles should draw at x=0,10,20 all with full 10px width,
    // with the last one clipped to the border area.
    expect(drawCalls[0]).toEqual([image, 0, 0, 10, 5]);
    expect(drawCalls[1]).toEqual([image, 10, 0, 10, 5]);
    expect(drawCalls[2]).toEqual([image, 20, 0, 10, 5]);
  });
});
