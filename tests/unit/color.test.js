import { describe, expect, it } from 'vitest';

import { clampNumber, hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '../../src/color.js';

describe('color conversion utilities', () => {
  it.each([
    {
      name: 'orange keeps stable round-trip values',
      input: { red: 255, green: 165, blue: 0 },
      expectedHsv: { hue: 39, sat: 255, val: 255 },
      expectedRoundTrip: { red: 255, green: 166, blue: 0 },
    },
    {
      name: 'steel blue keeps stable round-trip values',
      input: { red: 70, green: 130, blue: 180 },
      expectedHsv: { hue: 207, sat: 156, val: 180 },
      expectedRoundTrip: { red: 70, green: 130, blue: 180 },
    },
    {
      name: 'low-intensity blue keeps stable round-trip values',
      input: { red: 12, green: 34, blue: 56 },
      expectedHsv: { hue: 210, sat: 200, val: 56 },
      expectedRoundTrip: { red: 12, green: 34, blue: 56 },
    },
    {
      name: 'muted purple keeps stable round-trip values',
      input: { red: 123, green: 120, blue: 125 },
      expectedHsv: { hue: 276, sat: 10, val: 125 },
      expectedRoundTrip: { red: 123, green: 120, blue: 125 },
    },
  ])('$name', ({ input, expectedHsv, expectedRoundTrip }) => {
    const hsv = rgbToHsv(input.red, input.green, input.blue);
    expect(hsv).toEqual(expectedHsv);

    const roundTrip = hsvToRgb(hsv.hue, hsv.sat, hsv.val);
    expect(roundTrip).toEqual(expectedRoundTrip);
  });

  it.each([
    {
      name: 'black',
      rgb: { red: 0, green: 0, blue: 0 },
      hsv: { hue: 0, sat: 0, val: 0 },
    },
    {
      name: 'white',
      rgb: { red: 255, green: 255, blue: 255 },
      hsv: { hue: 0, sat: 0, val: 255 },
    },
    {
      name: 'red primary',
      rgb: { red: 255, green: 0, blue: 0 },
      hsv: { hue: 0, sat: 255, val: 255 },
    },
    {
      name: 'green primary',
      rgb: { red: 0, green: 255, blue: 0 },
      hsv: { hue: 120, sat: 255, val: 255 },
    },
    {
      name: 'blue primary',
      rgb: { red: 0, green: 0, blue: 255 },
      hsv: { hue: 240, sat: 255, val: 255 },
    },
  ])('edge bounds for $name', ({ rgb, hsv }) => {
    expect(rgbToHsv(rgb.red, rgb.green, rgb.blue)).toEqual(hsv);
    expect(hsvToRgb(hsv.hue, hsv.sat, hsv.val)).toEqual(rgb);
  });
});

describe('hexToRgb', () => {
  it.each([
    { name: 'null value', input: null, expected: null },
    { name: 'short value', input: '#abc', expected: null },
    { name: 'invalid characters', input: '#12GG55', expected: null },
  ])('returns null for $name', ({ input, expected }) => {
    expect(hexToRgb(input)).toBe(expected);
  });

  it.each([
    {
      name: 'lowercase six-digit with hash',
      input: '#12ab34',
      expected: { red: 18, green: 171, blue: 52, alpha: 255 },
    },
    {
      name: 'uppercase six-digit with hash',
      input: '#12AB34',
      expected: { red: 18, green: 171, blue: 52, alpha: 255 },
    },
    {
      name: 'eight-digit with alpha',
      input: '#3366CC80',
      expected: { red: 51, green: 102, blue: 204, alpha: 128 },
    },
    {
      name: 'leading and trailing spaces are trimmed',
      input: '  #00ff7f  ',
      expected: { red: 0, green: 255, blue: 127, alpha: 255 },
    },
    {
      name: 'hash prefix is optional',
      input: 'FF8800',
      expected: { red: 255, green: 136, blue: 0, alpha: 255 },
    },
  ])('parses $name', ({ input, expected }) => {
    expect(hexToRgb(input)).toEqual(expected);
  });
});

describe('rgbToHex', () => {
  it('returns #RRGGBB for opaque alpha', () => {
    expect(rgbToHex(12, 34, 56, 255)).toBe('#0c2238');
  });

  it('returns #RRGGBBAA for non-opaque alpha', () => {
    expect(rgbToHex(12, 34, 56, 128)).toBe('#0c223880');
  });

  it.each([
    { name: 'alpha over max clamps to opaque', inputAlpha: 999, expected: '#0c2238' },
    { name: 'alpha below min clamps to zero', inputAlpha: -4, expected: '#0c223800' },
    { name: 'string alpha is parsed as base-10 integer', inputAlpha: '42', expected: '#0c22382a' },
    {
      name: 'non-numeric alpha parses to NaN and defaults to opaque output format',
      inputAlpha: 'abc',
      expected: '#0c2238',
    },
  ])('handles $name', ({ inputAlpha, expected }) => {
    expect(rgbToHex(12, 34, 56, inputAlpha)).toBe(expected);
  });
});

describe('rgb/hex round trips', () => {
  it.each([
    {
      name: 'fully opaque color',
      input: { red: 255, green: 165, blue: 0, alpha: 255 },
      expectedHex: '#ffa500',
      expectedRgb: { red: 255, green: 165, blue: 0, alpha: 255 },
    },
    {
      name: 'semi-transparent color',
      input: { red: 51, green: 102, blue: 204, alpha: 128 },
      expectedHex: '#3366cc80',
      expectedRgb: { red: 51, green: 102, blue: 204, alpha: 128 },
    },
    {
      name: 'fully transparent black',
      input: { red: 0, green: 0, blue: 0, alpha: 0 },
      expectedHex: '#00000000',
      expectedRgb: { red: 0, green: 0, blue: 0, alpha: 0 },
    },
  ])('round-trips $name through hex', ({ input, expectedHex, expectedRgb }) => {
    const hex = rgbToHex(input.red, input.green, input.blue, input.alpha);
    expect(hex).toBe(expectedHex);
    expect(hexToRgb(hex)).toEqual(expectedRgb);
  });
});

describe('clampNumber', () => {
  it.each([
    {
      name: 'NaN input uses fallback',
      args: [Number.NaN, 0, 255, 12],
      expected: 12,
    },
    {
      name: 'negative value clamps to min',
      args: [-10, 0, 255, 99],
      expected: 0,
    },
    {
      name: 'value over max clamps to max',
      args: [999, 0, 255, 99],
      expected: 255,
    },
    {
      name: 'non-numeric string uses fallback',
      args: ['not-a-number', 0, 255, 77],
      expected: 77,
    },
  ])('$name', ({ args, expected }) => {
    expect(clampNumber(...args)).toBe(expected);
  });
});
