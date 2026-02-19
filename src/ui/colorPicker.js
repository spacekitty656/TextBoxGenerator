import { clampNumber, hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '../color.js';

export const TRANSPARENT_COLOR_VALUE = 'transparent';

export function setColorPickerFromHex(state, color) {
  if (!color) {
    return false;
  }

  if (color === TRANSPARENT_COLOR_VALUE) {
    state.alpha = 0;
    return true;
  }

  const rgb = hexToRgb(color);

  if (!rgb) {
    return false;
  }

  const hsv = rgbToHsv(rgb.red, rgb.green, rgb.blue);
  state.hue = hsv.hue;
  state.sat = hsv.sat;
  state.val = hsv.val;
  state.alpha = rgb.alpha ?? 255;
  state.draftHex = rgbToHex(rgb.red, rgb.green, rgb.blue, state.alpha);

  return true;
}

export function computeColorPickerUiState(state) {
  const hue = clampNumber(state.hue, 0, 360, 0);
  const sat = clampNumber(state.sat, 0, 255, 0);
  const val = clampNumber(state.val, 0, 255, 0);
  const alpha = clampNumber(state.alpha, 0, 255, 255);

  const rgb = hsvToRgb(hue === 360 ? 0 : hue, sat, val);
  const hex = rgbToHex(rgb.red, rgb.green, rgb.blue, alpha);

  return {
    hue,
    sat,
    val,
    alpha,
    rgb,
    hex,
    mapXPercent: (sat / 255) * 100,
    mapYPercent: 100 - ((val / 255) * 100),
    sliderYPercent: (hue / 360) * 100,
  };
}

export function syncColorPickerUI(state, uiElements) {
  const nextUiState = computeColorPickerUiState(state);
  state.hue = nextUiState.hue;
  state.sat = nextUiState.sat;
  state.val = nextUiState.val;
  state.alpha = nextUiState.alpha;
  state.draftHex = nextUiState.hex;

  const {
    selectedColorPreview,
    colorMap,
    colorMapHandle,
    colorSliderHandle,
    colorValueInputs,
  } = uiElements;

  if (selectedColorPreview) {
    if (nextUiState.alpha === 0) {
      selectedColorPreview.style.backgroundColor = '#d1d5db';
      selectedColorPreview.style.backgroundImage = 'conic-gradient(#e5e7eb 0deg 90deg, #d1d5db 90deg 180deg, #e5e7eb 180deg 270deg, #d1d5db 270deg 360deg)';
      selectedColorPreview.style.backgroundSize = '8px 8px';
    } else {
      selectedColorPreview.style.backgroundColor = `rgb(${nextUiState.rgb.red} ${nextUiState.rgb.green} ${nextUiState.rgb.blue} / ${(nextUiState.alpha / 255).toFixed(3)})`;
      selectedColorPreview.style.backgroundImage = 'none';
      selectedColorPreview.style.backgroundSize = 'auto';
    }
  }

  if (colorMap) {
    colorMap.style.background = `linear-gradient(to top, #000000, rgb(0 0 0 / 0%)), linear-gradient(to right, #ffffff, hsl(${nextUiState.hue}, 100%, 50%))`;
  }

  if (colorMapHandle) {
    colorMapHandle.style.left = `${nextUiState.mapXPercent}%`;
    colorMapHandle.style.top = `${nextUiState.mapYPercent}%`;
  }

  if (colorSliderHandle) {
    colorSliderHandle.style.top = `${nextUiState.sliderYPercent}%`;
  }

  if (colorValueInputs?.hue) {
    colorValueInputs.hue.value = String(nextUiState.hue);
    colorValueInputs.sat.value = String(nextUiState.sat);
    colorValueInputs.val.value = String(nextUiState.val);
    colorValueInputs.red.value = String(nextUiState.rgb.red);
    colorValueInputs.green.value = String(nextUiState.rgb.green);
    colorValueInputs.blue.value = String(nextUiState.rgb.blue);
    colorValueInputs.alpha.value = String(nextUiState.alpha);
    colorValueInputs.hex.value = nextUiState.hex;
  }
}

export function openColorWindowForFormat({
  colorWindowOverlay,
  colorWindowTitle,
  state,
  targetFormat = 'color',
  getSelectionColor,
}) {
  if (!colorWindowOverlay) {
    return;
  }

  state.targetFormat = targetFormat;
  state.targetInput = null;

  if (colorWindowTitle) {
    colorWindowTitle.textContent = targetFormat === 'background' ? 'Highlight Color' : 'Text Color';
  }

  const selectionColor = getSelectionColor(targetFormat);
  if (typeof selectionColor === 'string' && selectionColor.trim()) {
    const didUpdatePicker = setColorPickerFromHex(state, selectionColor);
    if (didUpdatePicker) {
      state.activeHex = state.draftHex;
    }
  }

  colorWindowOverlay.classList.remove('hidden');
  colorWindowOverlay.setAttribute('aria-hidden', 'false');
}
