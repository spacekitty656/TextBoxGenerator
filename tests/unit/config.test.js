import { describe, expect, it } from 'vitest';

import {
  getBorderConfig,
  getCanvasBackgroundConfig,
  getCanvasSizePaddingConfig,
} from '../../src/config.js';

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

describe('getCanvasBackgroundConfig', () => {
  it('maps solid mode and passes through color', () => {
    expect(
      getCanvasBackgroundConfig({
        isSolidMode: true,
        color: '#ffaa00',
      }),
    ).toEqual({
      mode: 'solid',
      color: '#ffaa00',
    });
  });

  it('maps transparent mode and passes through color', () => {
    expect(
      getCanvasBackgroundConfig({
        isSolidMode: false,
        color: 'rgba(0, 0, 0, 0.5)',
      }),
    ).toEqual({
      mode: 'transparent',
      color: 'rgba(0, 0, 0, 0.5)',
    });
  });
});

describe('getBorderConfig', () => {
  it('falls back width and radius for invalid or negative values', () => {
    const config = getBorderConfig({
      enabled: false,
      borderWidthValue: '-1',
      borderRadiusValue: 'not-a-number',
      colorMode: 'solid',
      color: '#123456',
      insideOutColorValues: [],
      backgroundMode: 'transparent',
      backgroundColor: '#ffffff',
      centerPaddingValue: '20',
      lockState: { top: true, right: true, bottom: true, left: true },
      sidePaddingValues: { top: '1', right: '2', bottom: '3', left: '4' },
      imageBorder: { imageData: null },
      clampToPositiveNumber,
    });

    expect(config.width).toBe(2);
    expect(config.radius).toBe(16);
  });

  it('uses center padding for locked sides and falls back when side values are missing', () => {
    const config = getBorderConfig({
      enabled: true,
      borderWidthValue: '3',
      borderRadiusValue: '4',
      colorMode: 'solid',
      color: '#000000',
      insideOutColorValues: [],
      backgroundMode: 'transparent',
      backgroundColor: '#ffffff',
      centerPaddingValue: '32',
      lockState: { top: true, right: false, bottom: false, left: true },
      sidePaddingValues: { right: undefined, bottom: '18' },
      imageBorder: {},
      clampToPositiveNumber,
      parsePaddingNumber,
    });

    expect(config.padding).toEqual({
      top: 32,
      right: 32,
      bottom: 18,
      left: 32,
    });
  });

  it('passes through color and image border related settings', () => {
    const insideOutColorValues = ['#111111', '#222222'];
    const imageBorder = { enabled: true, url: '/border.png' };

    const config = getBorderConfig({
      enabled: true,
      borderWidthValue: '8',
      borderRadiusValue: '12',
      colorMode: 'inside-out',
      color: '#333333',
      insideOutColorValues,
      backgroundMode: 'solid',
      backgroundColor: '#fefefe',
      centerPaddingValue: '24',
      lockState: { top: true, right: true, bottom: true, left: true },
      sidePaddingValues: { top: '1', right: '2', bottom: '3', left: '4' },
      imageBorder,
      clampToPositiveNumber,
      parsePaddingNumber,
    });

    expect(config.colorMode).toBe('inside-out');
    expect(config.backgroundMode).toBe('solid');
    expect(config.insideOutColors).toBe(insideOutColorValues);
    expect(config.imageBorder).toBe(imageBorder);
  });
});

describe('getCanvasSizePaddingConfig', () => {
  it('uses center fallback for missing unlocked side values', () => {
    const config = getCanvasSizePaddingConfig({
      centerPaddingValue: '40',
      lockState: { top: false, right: false, bottom: false, left: false },
      sidePaddingValues: { top: undefined, right: '10', bottom: undefined, left: '5' },
      clampToPositiveNumber,
      parsePaddingNumber,
    });

    expect(config).toEqual({
      top: 40,
      right: 10,
      bottom: 40,
      left: 5,
    });
  });

  it('resolves each side correctly across mixed lock permutations', () => {
    const config = getCanvasSizePaddingConfig({
      centerPaddingValue: '30',
      lockState: { top: false, right: true, bottom: false, left: true },
      sidePaddingValues: { top: '3', right: '8', bottom: undefined, left: '9' },
      clampToPositiveNumber,
      parsePaddingNumber,
    });

    expect(config).toEqual({
      top: 3,
      right: 30,
      bottom: 30,
      left: 30,
    });
  });
});
