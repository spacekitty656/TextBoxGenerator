export function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function hsvToRgb(hue, satByte, valByte) {
  const saturation = Math.min(1, Math.max(0, satByte / 255));
  const value = Math.min(1, Math.max(0, valByte / 255));
  const wrappedHue = ((hue % 360) + 360) % 360;
  const chroma = value * saturation;
  const hueSection = wrappedHue / 60;
  const second = chroma * (1 - Math.abs((hueSection % 2) - 1));

  let redPrime = 0;
  let greenPrime = 0;
  let bluePrime = 0;

  if (hueSection >= 0 && hueSection < 1) {
    redPrime = chroma;
    greenPrime = second;
  } else if (hueSection < 2) {
    redPrime = second;
    greenPrime = chroma;
  } else if (hueSection < 3) {
    greenPrime = chroma;
    bluePrime = second;
  } else if (hueSection < 4) {
    greenPrime = second;
    bluePrime = chroma;
  } else if (hueSection < 5) {
    redPrime = second;
    bluePrime = chroma;
  } else {
    redPrime = chroma;
    bluePrime = second;
  }

  const match = value - chroma;

  return {
    red: Math.round((redPrime + match) * 255),
    green: Math.round((greenPrime + match) * 255),
    blue: Math.round((bluePrime + match) * 255),
  };
}

export function rgbToHsv(red, green, blue) {
  const r = Math.min(1, Math.max(0, red / 255));
  const g = Math.min(1, Math.max(0, green / 255));
  const b = Math.min(1, Math.max(0, blue / 255));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * (((b - r) / delta) + 2);
    } else {
      hue = 60 * (((r - g) / delta) + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;

  return {
    hue: Math.round(hue),
    sat: Math.round(saturation * 255),
    val: Math.round(max * 255),
  };
}

export function rgbToHex(red, green, blue) {
  const toHex = (value) => value.toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function hexToRgb(hex) {
  if (typeof hex !== 'string') {
    return null;
  }

  const normalized = hex.trim().replace(/^#/, '');

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}
