import { describe, expect, it } from 'vitest';

import { getBorderConfig, getCanvasSizePaddingConfig } from '../../src/config.js';

function clampToPositiveNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function parsePaddingNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

describe('padding config parsing', () => {
  it('allows negative border padding values', () => {
    const config = getBorderConfig({
      enabled: true,
      borderWidthValue: '2',
      borderRadiusValue: '16',
      colorMode: 'solid',
      color: '#000000',
      insideOutColorValues: [],
      backgroundMode: 'transparent',
      backgroundColor: '#ffffff',
      centerPaddingValue: '-10',
      lockState: { top: true, right: false, bottom: false, left: false },
      sidePaddingValues: { top: '100', right: '-4', bottom: 'abc', left: '3' },
      imageBorder: {},
      clampToPositiveNumber,
      parsePaddingNumber,
    });

    expect(config.padding).toEqual({
      top: -10,
      right: -4,
      bottom: -10,
      left: 3,
    });
  });

  it('allows negative canvas size padding values', () => {
    const config = getCanvasSizePaddingConfig({
      centerPaddingValue: '-20',
      lockState: { top: false, right: true, bottom: false, left: false },
      sidePaddingValues: { top: '-1', right: '50', bottom: 'bad', left: '4' },
      clampToPositiveNumber,
      parsePaddingNumber,
    });

    expect(config).toEqual({
      top: -1,
      right: -20,
      bottom: -20,
      left: 4,
    });
  });
});
