import { clampNumber, hexToRgb, rgbToHsv } from './color.js';
import { getAlignedStartX, getAlignmentWidth } from './layout.js';
import {
  getBorderConfig as getBorderConfigFromModule,
  getCanvasBackgroundConfig as getCanvasBackgroundConfigFromModule,
  getCanvasSizePaddingConfig as getCanvasSizePaddingConfigFromModule,
} from './config.js';
import {
  TRANSPARENT_COLOR_VALUE,
  openColorWindowForFormat as openColorWindowForFormatModule,
  setColorPickerFromHex as setColorPickerFromHexModule,
  syncColorPickerUI as syncColorPickerUIModule,
} from './ui/colorPicker.js';
import {
  DEFAULT_SETTINGS_STORAGE_KEY,
  applySavedSettings as applySavedSettingsModule,
  closeSettingsWindow as closeSettingsWindowModule,
  openSettingsWindow as openSettingsWindowModule,
  persistSettings as persistSettingsModule,
} from './ui/settings.js';
import {
  drawImageBorder as drawImageBorderModule,
  drawSideImage as drawSideImageModule,
  getImageBorderSlotState as getImageBorderSlotStateModule,
} from './border/imageBorder.js';
import { createQuillEditor, extractDocumentFromDelta as extractDocumentFromDeltaModule } from './editor/quillAdapter.js';
import {
  layoutDocumentForCanvas as layoutDocumentForCanvasFromRenderer,
  calculateCanvasDimensions as calculateCanvasDimensionsFromRenderer,
} from './render/canvasRenderer.js';

const Quill = window.Quill;

const canvas = document.getElementById('preview-canvas');
const context = canvas.getContext('2d');
const editorElement = document.getElementById('editor');
const saveButton = document.getElementById('save-image');
const imageNameInput = document.getElementById('image-name');
const appVersionBadge = document.getElementById('app-version');
const settingsButton = document.getElementById('settings-button');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettingsWindowButton = document.getElementById('close-settings-window');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const APP_VERSION = 'v1.1.8';
const BASE_CANVAS_CONTENT_WIDTH = 900;
const SETTINGS_STORAGE_KEY = DEFAULT_SETTINGS_STORAGE_KEY;

const borderToggle = document.getElementById('enable-border');
const borderOptions = document.getElementById('border-options');
const borderWidthInput = document.getElementById('border-width');
const borderRadiusInput = document.getElementById('border-radius');
const borderColorSolidRadio = document.getElementById('border-color-solid');
const borderColorInsideOutRadio = document.getElementById('border-color-inside-out');
const borderColorImagesRadio = document.getElementById('border-color-images');
const borderColorInput = document.getElementById('border-color-input');
const backgroundColorTransparentRadio = document.getElementById('background-color-transparent');
const backgroundColorSolidRadio = document.getElementById('background-color-solid');
const backgroundColorInput = document.getElementById('background-color-input');
const borderBackgroundColorTransparentRadio = document.getElementById('border-background-color-transparent');
const borderBackgroundColorSolidRadio = document.getElementById('border-background-color-solid');
const borderBackgroundColorInput = document.getElementById('border-background-color-input');
const insideOutColors = document.getElementById('inside-out-colors');
const insideOutColorList = document.getElementById('inside-out-color-list');
const insideOutAddColorButton = document.getElementById('inside-out-add-color');
const imageBorderControls = document.getElementById('image-border-controls');
const imageBorderSizingModeInput = document.getElementById('image-border-sizing-mode');
const imageBorderRepeatModeInput = document.getElementById('image-border-repeat-mode');
const imageBorderCornerInputs = {
  topLeft: document.getElementById('image-border-corner-top-left'),
  topRight: document.getElementById('image-border-corner-top-right'),
  bottomRight: document.getElementById('image-border-corner-bottom-right'),
  bottomLeft: document.getElementById('image-border-corner-bottom-left'),
};
const imageBorderSideInputs = {
  top: document.getElementById('image-border-side-top'),
  right: document.getElementById('image-border-side-right'),
  bottom: document.getElementById('image-border-side-bottom'),
  left: document.getElementById('image-border-side-left'),
};
const insideOutColorInputs = [];

function createImageBorderSlotState() {
  return {
    image: null,
    sourceName: '',
    status: 'empty',
    error: null,
  };
}

const imageBorderState = {
  corners: {
    topLeft: createImageBorderSlotState(),
    topRight: createImageBorderSlotState(),
    bottomRight: createImageBorderSlotState(),
    bottomLeft: createImageBorderSlotState(),
  },
  sides: {
    top: createImageBorderSlotState(),
    right: createImageBorderSlotState(),
    bottom: createImageBorderSlotState(),
    left: createImageBorderSlotState(),
  },
};

const centerPaddingInput = document.getElementById('padding-center');
const sidePaddingControls = {
  top: { input: document.getElementById('padding-top'), lock: document.getElementById('lock-top') },
  right: { input: document.getElementById('padding-right'), lock: document.getElementById('lock-right') },
  bottom: { input: document.getElementById('padding-bottom'), lock: document.getElementById('lock-bottom') },
  left: { input: document.getElementById('padding-left'), lock: document.getElementById('lock-left') },
};

const wrapTextInput = document.getElementById('wrap-text');
const maxImageWidthInput = document.getElementById('max-image-width');
const colorWindowOverlay = document.getElementById('color-window-overlay');
const closeColorWindowButton = document.getElementById('close-color-window');
const basicColorsGrid = document.querySelector('.basic-colors-grid');
const customColorsGrid = document.querySelector('.custom-colors-grid');
const canvasPanel = document.querySelector('.canvas-panel');
const formPanel = document.querySelector('.form-panel');
const addCustomColorButton = document.getElementById('add-custom-color');
const pickScreenColorButton = document.getElementById('pick-screen-color');
const openBackgroundColorWindowButton = document.querySelector('.ql-open-background-color-window');
const backgroundColorWindowButton = document.getElementById('background-color-window-button');
const borderColorWindowButton = document.getElementById('border-color-window-button');
const borderBackgroundColorWindowButton = document.getElementById('border-background-color-window-button');

const colorMap = document.getElementById('color-map');
const colorMapHandle = document.getElementById('color-map-handle');
const colorSlider = document.getElementById('color-slider');
const colorSliderHandle = document.getElementById('color-slider-handle');
const selectedColorPreview = document.getElementById('selected-color-preview');
const colorWindowTitle = document.getElementById('color-window-title');
const colorValueInputs = {
  hue: document.getElementById('color-value-hue'),
  sat: document.getElementById('color-value-sat'),
  val: document.getElementById('color-value-val'),
  red: document.getElementById('color-value-red'),
  green: document.getElementById('color-value-green'),
  blue: document.getElementById('color-value-blue'),
  alpha: document.getElementById('color-value-alpha'),
  hex: document.getElementById('color-value-hex'),
};
const colorWindowOkButton = document.getElementById('color-window-ok');
const colorWindowCancelButton = document.getElementById('color-window-cancel');

const colorPickerState = {
  hue: 35,
  sat: 232,
  val: 255,
  alpha: 255,
  draftHex: '#ff9e17',
  activeHex: '#ff9e17',
  targetFormat: 'color',
  targetInput: null,
  dragTarget: null,
  isPickingFromScreen: false,
};

const basicColorPalette = [
  TRANSPARENT_COLOR_VALUE,
  '#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
  '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
  '#400000', '#804000', '#408000', '#004000', '#004040', '#000040', '#400040', '#404040',
  '#ff8080', '#ffc080', '#ffff80', '#80ff80', '#80ffff', '#8080ff', '#ff80ff', '#d0d0d0',
  '#8000ff', '#ff0080', '#ff8000', '#80ff00', '#00ff80', '#0080ff', '#8000ff', '#ffe680',
  '#660033', '#cc3300', '#cc6600', '#66cc00', '#00cc66', '#0066cc', '#3300cc', '#66ffff',
];

const customColorPalette = Array.from({ length: 16 }, () => '#f3f4f6');

function handleAddCustomColor() {
  customColorPalette.pop();
  customColorPalette.unshift(colorPickerState.draftHex);
  populateColorGrid(customColorsGrid, customColorPalette);
}

function setColorPickerFromHex(color) {
  const didSet = setColorPickerFromHexModule(colorPickerState, color);
  if (didSet) {
    syncColorPickerUI();
  }

  return didSet;
}

function populateColorGrid(gridElement, colors) {
  if (!gridElement) {
    return;
  }

  gridElement.innerHTML = '';
  colors.forEach((color) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch';
    if (color === TRANSPARENT_COLOR_VALUE) {
      swatch.classList.add('transparent-swatch');
      swatch.title = 'Transparent';
      swatch.setAttribute('aria-label', 'Use transparent color');
    } else {
      swatch.style.background = color;
      swatch.setAttribute('aria-label', `Use color ${color}`);
    }
    swatch.addEventListener('click', () => {
      setColorPickerFromHex(color);
    });
    gridElement.appendChild(swatch);
  });
}


function syncColorPickerUI() {
  syncColorPickerUIModule(colorPickerState, {
    selectedColorPreview,
    colorMap,
    colorMapHandle,
    colorSliderHandle,
    colorValueInputs,
  });
}

function updateMapFromPointer(event) {
  if (!colorMap) {
    return;
  }

  const rect = colorMap.getBoundingClientRect();
  const x = Math.min(rect.width, Math.max(0, event.clientX - rect.left));
  const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
  colorPickerState.sat = Math.round((x / rect.width) * 255);
  colorPickerState.val = Math.round((1 - (y / rect.height)) * 255);
  syncColorPickerUI();
}

function updateHueFromPointer(event) {
  if (!colorSlider) {
    return;
  }

  const rect = colorSlider.getBoundingClientRect();
  const y = Math.min(rect.height, Math.max(0, event.clientY - rect.top));
  colorPickerState.hue = Math.round((y / rect.height) * 360);
  syncColorPickerUI();
}


async function pickColorFromScreen() {
  if (!window.EyeDropper) {
    return;
  }

  try {
    colorPickerState.isPickingFromScreen = true;
    const eyeDropper = new window.EyeDropper();
    const result = await eyeDropper.open();

    if (result?.sRGBHex) {
      setColorPickerFromHex(result.sRGBHex);
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Unable to pick a color from screen.', error);
    }
  } finally {
    colorPickerState.isPickingFromScreen = false;
    if (pickScreenColorButton) {
      pickScreenColorButton.disabled = false;
    }
  }
}

function applyDraftColorFromWindow() {
  if (!colorPickerState.draftHex) {
    return;
  }

  colorPickerState.activeHex = colorPickerState.draftHex;

  if (colorPickerState.targetInput) {
    colorPickerState.targetInput.value = colorPickerState.activeHex;
    colorPickerState.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    closeColorWindow();
    return;
  }

  quill.focus();

  const formatValue = colorPickerState.alpha === 0
    ? false
    : colorPickerState.activeHex;

  quill.format(colorPickerState.targetFormat, formatValue, 'user');
  closeColorWindow();
  syncColorPreviewButtons();
  drawEditorToCanvas();
}

function openColorWindowForFormat(targetFormat = 'color') {
  openColorWindowForFormatModule({
    colorWindowOverlay,
    colorWindowTitle,
    state: colorPickerState,
    targetFormat,
    getSelectionColor: (format) => quill.getFormat()?.[format],
  });
  syncColorPickerUI();
}


function openColorWindowForInput(targetInput, title) {
  if (!colorWindowOverlay || !targetInput) {
    return;
  }

  colorPickerState.targetInput = targetInput;

  if (colorWindowTitle) {
    colorWindowTitle.textContent = title;
  }

  if (typeof targetInput.value === 'string' && targetInput.value.trim()) {
    setColorPickerFromHex(targetInput.value);
  }

  syncColorPickerUI();
  colorWindowOverlay.classList.remove('hidden');
  colorWindowOverlay.setAttribute('aria-hidden', 'false');
}

function syncColorPreviewButtons() {
  if (backgroundColorWindowButton) {
    backgroundColorWindowButton.style.setProperty('--preview-swatch-color', backgroundColorInput.value);
    backgroundColorWindowButton.disabled = backgroundColorInput.disabled;
  }

  if (borderColorWindowButton) {
    borderColorWindowButton.style.setProperty('--preview-swatch-color', borderColorInput.value);
    borderColorWindowButton.disabled = borderColorInput.disabled;
  }

  if (borderBackgroundColorWindowButton) {
    borderBackgroundColorWindowButton.style.setProperty('--preview-swatch-color', borderBackgroundColorInput.value);
    borderBackgroundColorWindowButton.disabled = borderBackgroundColorInput.disabled;
  }
}

function openColorWindow() {
  openColorWindowForFormat('color');
}

function openBackgroundColorWindow() {
  openColorWindowForFormat('background');
}

function closeColorWindow() {
  if (!colorWindowOverlay) {
    return;
  }

  colorWindowOverlay.classList.add('hidden');
  colorWindowOverlay.setAttribute('aria-hidden', 'true');
}

function openSettingsWindow() {
  openSettingsWindowModule(settingsOverlay);
}

function closeSettingsWindow() {
  closeSettingsWindowModule(settingsOverlay);
}

function applyDarkMode(enabled) {
  document.body.classList.toggle('dark-mode', enabled);
}

function persistSettings() {
  if (!darkModeToggle) {
    return;
  }

  persistSettingsModule(window.localStorage, { darkMode: Boolean(darkModeToggle.checked) }, SETTINGS_STORAGE_KEY);
}

function applySavedSettings() {
  applySavedSettingsModule({
    storage: window.localStorage,
    darkModeToggle,
    applyDarkMode,
    storageKey: SETTINGS_STORAGE_KEY,
  });
}


function panelHasVerticalScrollbar(panelElement) {
  if (!panelElement) {
    return false;
  }

  return panelElement.scrollHeight > panelElement.clientHeight;
}

function forwardCanvasPanelScrollToFormPanel(event) {
  if (!formPanel || panelHasVerticalScrollbar(canvasPanel)) {
    return;
  }

  formPanel.scrollTop += event.deltaY;
  event.preventDefault();
}

const imageCenterPaddingInput = document.getElementById('image-padding-center');
const imageSidePaddingControls = {
  top: { input: document.getElementById('image-padding-top'), lock: document.getElementById('image-lock-top') },
  right: { input: document.getElementById('image-padding-right'), lock: document.getElementById('image-lock-right') },
  bottom: { input: document.getElementById('image-padding-bottom'), lock: document.getElementById('image-lock-bottom') },
  left: { input: document.getElementById('image-padding-left'), lock: document.getElementById('image-lock-left') },
};

const lockState = {
  top: true,
  right: true,
  bottom: true,
  left: true,
};

const imageLockState = {
  top: true,
  right: true,
  bottom: true,
  left: true,
};

const FONT_WHITELIST = ['sansserif', 'serif', 'monospace', 'pressstart2p'];

const QuillFont = Quill.import('formats/font');
QuillFont.whitelist = FONT_WHITELIST;
Quill.register(QuillFont, true);

const FONT_MAP = {
  sansserif: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  monospace: '"Courier New", Courier, monospace',
  pressstart2p: '"Press Start 2P", "Courier New", monospace',
};

const SIZE_MAP = {
  small: 14,
  normal: 18,
  large: 24,
  huge: 32,
};

const backgroundMetricsHeightCache = new Map();

const DEFAULT_STYLE = {
  bold: false,
  italic: false,
  underline: false,
  color: '#111827',
  background: null,
  font: 'sansserif',
  size: 'normal',
};

const quill = createQuillEditor(Quill, {
  'open-color-window': openColorWindow,
  'open-background-color-window': openBackgroundColorWindow,
});



quill.setContents([
  {
    insert: 'Hello, world!',
    attributes: {
      size: 'large',
      color: '#111827',
    },
  },
  {
    insert: '\n',
    attributes: {
      align: 'left',
    },
  },
]);

function isTextWrapEnabled() {
  return !wrapTextInput || wrapTextInput.checked;
}

function syncEditorWrapMode() {
  const wrapEnabled = isTextWrapEnabled();
  editorElement.classList.toggle('editor-no-wrap', !wrapEnabled);

  if (maxImageWidthInput) {
    maxImageWidthInput.disabled = !wrapEnabled;
  }
}

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

async function loadImageFromFile(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file.');
  }

  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const imageElement = new Image();
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error('Unable to load image.'));
    imageElement.src = URL.createObjectURL(file);
  });
}

function getImageBorderSlotState(slotType, slotName) {
  return getImageBorderSlotStateModule(imageBorderState, slotType, slotName);
}

function clearImageBorderSlot(slotState) {
  if (!slotState) {
    return;
  }

  slotState.image = null;
  slotState.sourceName = '';
  slotState.status = 'empty';
  slotState.error = null;
}

async function handleImageBorderFileChange(slotType, slotName, fileInput) {
  const slotState = getImageBorderSlotState(slotType, slotName);

  if (!slotState) {
    return;
  }

  const [selectedFile] = fileInput.files || [];

  if (!selectedFile) {
    clearImageBorderSlot(slotState);
    drawEditorToCanvas();
    return;
  }

  if (!selectedFile.type || !selectedFile.type.startsWith('image/')) {
    clearImageBorderSlot(slotState);
    slotState.status = 'error';
    slotState.error = 'Invalid file type';
    fileInput.value = '';
    drawEditorToCanvas();
    return;
  }

  slotState.status = 'loading';
  slotState.error = null;

  try {
    const loadedImage = await loadImageFromFile(selectedFile);
    slotState.image = loadedImage;
    slotState.sourceName = selectedFile.name;
    slotState.status = 'ready';
    slotState.error = null;
    drawEditorToCanvas();
  } catch (error) {
    clearImageBorderSlot(slotState);
    slotState.status = 'error';
    slotState.error = error instanceof Error ? error.message : 'Unable to load image';
    drawEditorToCanvas();
  }
}

function updateImageBorderSlotInputsState(isImageModeActive) {
  [
    ...Object.values(imageBorderCornerInputs),
    ...Object.values(imageBorderSideInputs),
  ].forEach((input) => {
    if (input) {
      input.disabled = !isImageModeActive;
    }
  });
}

function registerInsideOutColorInput(input) {
  input.addEventListener('input', () => {
    syncLockedPaddingValues();
    drawEditorToCanvas();
  });
}

function updateInsideOutColorRowsState() {
  const showInsideOutColors = borderColorInsideOutRadio.checked && borderToggle.checked;
  const hasMinimumColors = insideOutColorInputs.length <= 1;

  insideOutColorInputs.forEach((input, index) => {
    const row = input.closest('.inside-out-color-row');
    const indexLabel = row.querySelector('.inside-out-index');
    const deleteButton = row.querySelector('.inside-out-delete');
    const upButton = row.querySelector('.inside-out-up');
    const downButton = row.querySelector('.inside-out-down');
    const inputId = `inside-out-color-${index + 1}`;

    row.setAttribute('for', inputId);
    input.id = inputId;
    indexLabel.textContent = String(index + 1);

    input.disabled = !showInsideOutColors;
    deleteButton.disabled = !showInsideOutColors || hasMinimumColors;
    upButton.disabled = !showInsideOutColors || index === 0;
    downButton.disabled = !showInsideOutColors || index === insideOutColorInputs.length - 1;
  });
}

function createInsideOutColorRow(value = '#1f2937') {
  const row = document.createElement('label');
  row.className = 'inside-out-color-row';

  const controls = document.createElement('div');
  controls.className = 'inside-out-row-controls';

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'inside-out-row-button inside-out-delete';
  deleteButton.setAttribute('aria-label', 'Delete color');
  deleteButton.textContent = '🗑️';

  const downButton = document.createElement('button');
  downButton.type = 'button';
  downButton.className = 'inside-out-row-button inside-out-down';
  downButton.setAttribute('aria-label', 'Move color down');
  downButton.textContent = '↓';

  const upButton = document.createElement('button');
  upButton.type = 'button';
  upButton.className = 'inside-out-row-button inside-out-up';
  upButton.setAttribute('aria-label', 'Move color up');
  upButton.textContent = '↑';

  controls.append(deleteButton, downButton, upButton);

  const rowNumber = document.createElement('span');
  rowNumber.className = 'inside-out-index';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = value;

  deleteButton.addEventListener('click', () => {
    const rowIndex = insideOutColorInputs.indexOf(colorInput);
    if (rowIndex === -1) {
      return;
    }

    insideOutColorInputs.splice(rowIndex, 1);
    row.remove();
    updateInsideOutColorRowsState();
    drawEditorToCanvas();
  });

  upButton.addEventListener('click', () => {
    const rowIndex = insideOutColorInputs.indexOf(colorInput);
    if (rowIndex <= 0) {
      return;
    }

    [insideOutColorInputs[rowIndex - 1], insideOutColorInputs[rowIndex]] = [
      insideOutColorInputs[rowIndex],
      insideOutColorInputs[rowIndex - 1],
    ];

    insideOutColorList.insertBefore(row, row.previousElementSibling);
    updateInsideOutColorRowsState();
    drawEditorToCanvas();
  });

  downButton.addEventListener('click', () => {
    const rowIndex = insideOutColorInputs.indexOf(colorInput);
    if (rowIndex < 0 || rowIndex >= insideOutColorInputs.length - 1) {
      return;
    }

    [insideOutColorInputs[rowIndex], insideOutColorInputs[rowIndex + 1]] = [
      insideOutColorInputs[rowIndex + 1],
      insideOutColorInputs[rowIndex],
    ];

    insideOutColorList.insertBefore(row.nextElementSibling, row);
    updateInsideOutColorRowsState();
    drawEditorToCanvas();
  });

  registerInsideOutColorInput(colorInput);
  row.append(controls, rowNumber, colorInput);
  insideOutColorList.append(row);
  insideOutColorInputs.push(colorInput);
  updateInsideOutColorRowsState();
}

function addInsideOutColor() {
  const outerMostColor = insideOutColorInputs[insideOutColorInputs.length - 1]?.value || '#1f2937';
  createInsideOutColorRow(outerMostColor);
  drawEditorToCanvas();
}

function triggerSaveImage() {
  saveButton.click();
}

function syncPaddingValues(centerInput, controls, lockStates, fallback) {
  const centerValue = parsePaddingNumber(centerInput.value, fallback);

  Object.entries(controls).forEach(([side, control]) => {
    const isLocked = lockStates[side];
    control.lock.setAttribute('aria-pressed', String(isLocked));
    control.lock.textContent = isLocked ? '🔒' : '🔓';

    if (isLocked) {
      control.input.value = centerValue;
      control.input.disabled = true;
    } else {
      control.input.disabled = false;
    }
  });
}

function syncLockedPaddingValues() {
  syncPaddingValues(centerPaddingInput, sidePaddingControls, lockState, 24);
}

function syncImageLockedPaddingValues() {
  syncPaddingValues(imageCenterPaddingInput, imageSidePaddingControls, imageLockState, 50);
}

function resolveBorderColorMode() {
  const modeRadios = [borderColorSolidRadio, borderColorInsideOutRadio, borderColorImagesRadio];
  const selectedMode = modeRadios.find((radioInput) => radioInput?.checked)?.value;

  if (selectedMode === 'inside-out' || selectedMode === 'images') {
    return selectedMode;
  }

  return 'solid';
}

function getBorderConfig() {
  return getBorderConfigFromModule({
    enabled: borderToggle.checked,
    borderWidthValue: borderWidthInput.value,
    borderRadiusValue: borderRadiusInput.value,
    colorMode: resolveBorderColorMode(),
    color: borderColorInput.value,
    insideOutColorValues: insideOutColorInputs.map((input) => input.value),
    backgroundMode: borderBackgroundColorSolidRadio.checked ? 'solid' : 'transparent',
    backgroundColor: borderBackgroundColorInput.value,
    centerPaddingValue: centerPaddingInput.value,
    lockState,
    sidePaddingValues: {
      top: sidePaddingControls.top.input.value,
      right: sidePaddingControls.right.input.value,
      bottom: sidePaddingControls.bottom.input.value,
      left: sidePaddingControls.left.input.value,
    },
    imageBorder: {
      corners: imageBorderState.corners,
      sides: imageBorderState.sides,
      sizingStrategy: imageBorderSizingModeInput?.value || 'auto',
      sideMode: imageBorderRepeatModeInput?.value || 'stretch',
    },
    clampToPositiveNumber,
    parsePaddingNumber,
  });
}

function getCanvasBackgroundConfig() {
  return getCanvasBackgroundConfigFromModule({
    isSolidMode: backgroundColorSolidRadio.checked,
    color: backgroundColorInput.value,
  });
}

function getCanvasSizePaddingConfig() {
  return getCanvasSizePaddingConfigFromModule({
    centerPaddingValue: imageCenterPaddingInput.value,
    lockState: imageLockState,
    sidePaddingValues: {
      top: imageSidePaddingControls.top.input.value,
      right: imageSidePaddingControls.right.input.value,
      bottom: imageSidePaddingControls.bottom.input.value,
      left: imageSidePaddingControls.left.input.value,
    },
    clampToPositiveNumber,
    parsePaddingNumber,
  });
}


function resolveEditorBackgroundColor(borderConfig, canvasBackgroundConfig) {
  if (borderConfig.backgroundMode === 'solid' && borderConfig.backgroundColor) {
    return borderConfig.backgroundColor;
  }

  if (canvasBackgroundConfig.mode === 'solid' && canvasBackgroundConfig.color) {
    return canvasBackgroundConfig.color;
  }

  return '#ffffff';
}

function updateEditorBackgroundColor(borderConfig, canvasBackgroundConfig) {
  if (!editorElement) {
    return;
  }

  editorElement.style.backgroundColor = resolveEditorBackgroundColor(borderConfig, canvasBackgroundConfig);
}

function updateBorderControlsState() {
  const enabled = borderToggle.checked;
  borderOptions.classList.toggle('hidden', !enabled);
  borderOptions.classList.toggle('disabled', !enabled);
  borderOptions.setAttribute('aria-disabled', String(!enabled));

  [
    centerPaddingInput,
    borderWidthInput,
    borderRadiusInput,
    borderColorSolidRadio,
    borderColorInsideOutRadio,
    borderColorImagesRadio,
    borderColorInput,
    borderBackgroundColorTransparentRadio,
    borderBackgroundColorSolidRadio,
    borderBackgroundColorInput,
    insideOutAddColorButton,
    imageBorderSizingModeInput,
    imageBorderRepeatModeInput,
    ...Object.values(sidePaddingControls).map((control) => control.lock),
  ].forEach((element) => {
    if (element) {
      element.disabled = !enabled;
    }
  });

  updateBorderColorModeUI();
  syncLockedPaddingValues();
}

function updateBorderColorModeUI() {
  const isBorderEnabled = borderToggle.checked;
  const selectedMode = resolveBorderColorMode();
  const solidModeActive = selectedMode === 'solid' && isBorderEnabled;
  const showInsideOutColors = selectedMode === 'inside-out' && isBorderEnabled;
  const showImageControls = selectedMode === 'images' && isBorderEnabled;

  borderColorInput.disabled = !solidModeActive;
  borderBackgroundColorInput.disabled = !(borderBackgroundColorSolidRadio.checked && isBorderEnabled);
  syncColorPreviewButtons();
  insideOutAddColorButton.disabled = !showInsideOutColors;
  insideOutColors.classList.toggle('hidden', !showInsideOutColors);
  imageBorderControls?.classList.toggle('hidden', !showImageControls);

  if (imageBorderSizingModeInput) {
    imageBorderSizingModeInput.disabled = !showImageControls;
  }

  if (imageBorderRepeatModeInput) {
    imageBorderRepeatModeInput.disabled = !showImageControls;
  }

  updateImageBorderSlotInputsState(showImageControls);
  updateInsideOutColorRowsState();
}

function updateCanvasBackgroundControlsState() {
  backgroundColorInput.disabled = !backgroundColorSolidRadio.checked;
  syncColorPreviewButtons();
}

function getCanvasStyle(attributes = {}) {
  const merged = { ...DEFAULT_STYLE, ...attributes };
  const fontSize = SIZE_MAP[merged.size] || Number.parseInt(merged.size, 10) || SIZE_MAP.normal;
  const fontFamily = FONT_MAP[merged.font] || merged.font || FONT_MAP.sansserif;

  return {
    bold: Boolean(merged.bold),
    italic: Boolean(merged.italic),
    underline: Boolean(merged.underline),
    color: merged.color || DEFAULT_STYLE.color,
    background: typeof merged.background === 'string' && merged.background.trim() ? merged.background : null,
    fontSize,
    fontFamily,
  };
}


function getBackgroundRectHeightForFont(font, fallbackFontSize) {
  if (backgroundMetricsHeightCache.has(font)) {
    return backgroundMetricsHeightCache.get(font);
  }

  context.font = font;
  const metrics = context.measureText('Mg');
  const actualAscent = metrics.actualBoundingBoxAscent ?? fallbackFontSize * 0.8;
  const actualDescent = metrics.actualBoundingBoxDescent ?? fallbackFontSize * 0.2;
  const height = Math.max(1, actualAscent + actualDescent);
  backgroundMetricsHeightCache.set(font, height);
  return height;
}

function buildCanvasFont(style) {
  const segments = [];

  if (style.italic) {
    segments.push('italic');
  }

  if (style.bold) {
    segments.push('700');
  }

  segments.push(`${style.fontSize}px`);
  segments.push(style.fontFamily);

  return segments.join(' ');
}

function layoutDocumentForCanvas(lines, maxWidth, wrapEnabled) {
  return layoutDocumentForCanvasFromRenderer(lines, maxWidth, wrapEnabled, {
    getCanvasStyle,
    buildCanvasFont,
    defaultFontSize: SIZE_MAP.normal,
    measureText: (text, font) => {
      context.font = font;
      return context.measureText(text).width;
    },
  });
}


function calculateCanvasDimensions(laidOutLines, borderConfig, canvasSizePaddingConfig, maxContentWidth) {
  return calculateCanvasDimensionsFromRenderer(
    laidOutLines,
    borderConfig,
    canvasSizePaddingConfig,
    maxContentWidth,
    { measureRenderedVerticalBounds },
  );
}



function extractDocumentFromDelta(delta) {
  return extractDocumentFromDeltaModule(delta);
}

function drawRoundedRectPath(x, y, width, height, radius) {
  const cappedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + cappedRadius, y);
  context.lineTo(x + width - cappedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + cappedRadius);
  context.lineTo(x + width, y + height - cappedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - cappedRadius, y + height);
  context.lineTo(x + cappedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - cappedRadius);
  context.lineTo(x, y + cappedRadius);
  context.quadraticCurveTo(x, y, x + cappedRadius, y);
  context.closePath();
}

function measureRenderedVerticalBounds(laidOutLines, textStartY) {
  let renderedMinY = Number.POSITIVE_INFINITY;
  let renderedMaxY = Number.NEGATIVE_INFINITY;
  let y = textStartY;

  laidOutLines.forEach((line) => {
    line.tokens.forEach((token) => {
      const metricsSource = token.text.trim() ? token.text : 'M';
      context.font = token.font;
      const textMetrics = context.measureText(metricsSource);
      const actualAscent = textMetrics.actualBoundingBoxAscent ?? token.style.fontSize * 0.8;
      const actualDescent = textMetrics.actualBoundingBoxDescent ?? token.style.fontSize * 0.2;
      const glyphTop = y;
      const glyphBottom = y + actualAscent + actualDescent;

      renderedMinY = Math.min(renderedMinY, glyphTop);
      renderedMaxY = Math.max(renderedMaxY, glyphBottom);

      if (token.style.underline && token.text.trim()) {
        const underlineY = y + token.style.fontSize + 2;
        const underlineWidth = Math.max(1, token.style.fontSize / 14);
        renderedMaxY = Math.max(renderedMaxY, underlineY + underlineWidth / 2);
      }
    });

    y += line.lineHeight;
  });

  if (!Number.isFinite(renderedMinY) || !Number.isFinite(renderedMaxY)) {
    return {
      minY: textStartY,
      maxY: textStartY + SIZE_MAP.normal,
    };
  }

  return {
    minY: renderedMinY,
    maxY: renderedMaxY,
  };
}

function hasReadyImage(slot) {
  return Boolean(slot && slot.status === 'ready' && slot.image);
}

function getSlotImageSize(slot) {
  if (!hasReadyImage(slot)) {
    return { width: 0, height: 0 };
  }

  const width = slot.image.width || slot.image.naturalWidth || 0;
  const height = slot.image.height || slot.image.naturalHeight || 0;
  return { width, height };
}

function drawSideImage(slot, x, y, width, height, orientation, sideMode) {
  return drawSideImageModule({ context, slot, x, y, width, height, orientation, sideMode });
}


function drawImageBorder(borderConfig, borderX, borderY, borderRectWidth, borderRectHeight) {
  return drawImageBorderModule({
    context,
    borderConfig,
    borderX,
    borderY,
    borderRectWidth,
    borderRectHeight,
    drawRoundedRectPath,
  });
}


function renderDocumentToCanvas(laidOutLines, borderConfig, canvasBackgroundConfig, canvasSizePaddingConfig, maxContentWidth) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (canvasBackgroundConfig.mode === 'solid') {
    context.fillStyle = canvasBackgroundConfig.color;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.textBaseline = 'top';

  const borderWidth = borderConfig.enabled ? borderConfig.width : 0;
  const usesImageBorder = borderConfig.enabled && borderConfig.colorMode === 'images';
  const borderInset = borderConfig.enabled
    ? (usesImageBorder ? borderWidth : borderWidth / 2)
    : 0;
  const borderSizeContribution = borderConfig.enabled
    ? (usesImageBorder ? borderWidth * 2 : borderWidth)
    : 0;
  const textPadding = borderConfig.enabled
    ? borderConfig.padding
    : { top: 0, right: 0, bottom: 0, left: 0 };

  const textStartX = canvasSizePaddingConfig.left + borderWidth + textPadding.left;
  const textStartY = canvasSizePaddingConfig.top + borderWidth + textPadding.top;

  const alignmentWidth = getAlignmentWidth(laidOutLines, maxContentWidth);
  const lineStartPositions = laidOutLines.map((line) => getAlignedStartX(line.align, textStartX, alignmentWidth, line.width));
  const renderedMinX = lineStartPositions.length ? Math.min(...lineStartPositions) : textStartX;
  const renderedMaxX = laidOutLines.reduce((maxX, line, index) => Math.max(maxX, lineStartPositions[index] + line.width), renderedMinX);
  const verticalBounds = measureRenderedVerticalBounds(laidOutLines, textStartY);

  let borderX = 0;
  let borderY = 0;
  let borderRectWidth = 0;
  let borderRectHeight = 0;

  if (borderConfig.enabled) {
    borderX = renderedMinX - textPadding.left - borderInset;
    borderY = verticalBounds.minY - textPadding.top - borderInset;
    borderRectWidth = renderedMaxX - renderedMinX + textPadding.left + textPadding.right + borderSizeContribution;
    borderRectHeight = verticalBounds.maxY - verticalBounds.minY + textPadding.top + textPadding.bottom + borderSizeContribution;

    if (borderConfig.backgroundMode === 'solid') {
      const fillInset = borderWidth / 2;
      context.fillStyle = borderConfig.backgroundColor;
      drawRoundedRectPath(
        borderX + fillInset,
        borderY + fillInset,
        borderRectWidth - borderWidth,
        borderRectHeight - borderWidth,
        Math.max(0, borderConfig.radius - fillInset),
      );
      context.fill();
    }
  }

  if (borderConfig.enabled && borderWidth > 0) {
    switch (borderConfig.colorMode) {
      case 'inside-out': {
        const palette = borderConfig.insideOutColors.filter((color) => typeof color === 'string' && color.length > 0);
        const segmentCount = Math.max(1, palette.length);
        const segmentWidth = borderWidth / segmentCount;

        const innerInset = borderWidth / 2;

        for (let drawIndex = segmentCount - 1; drawIndex >= 0; drawIndex -= 1) {
          const strokeWidth = (drawIndex + 1) * segmentWidth;
          const centerInset = innerInset - (strokeWidth / 2);
          context.lineWidth = strokeWidth;
          context.strokeStyle = palette[drawIndex] || borderConfig.color;
          drawRoundedRectPath(
            borderX + centerInset,
            borderY + centerInset,
            borderRectWidth - (centerInset * 2),
            borderRectHeight - (centerInset * 2),
            Math.max(0, borderConfig.radius - centerInset),
          );
          context.stroke();
        }
        break;
      }
      case 'images':
        drawImageBorder(borderConfig, borderX, borderY, borderRectWidth, borderRectHeight);
        break;
      case 'solid':
      default:
        context.lineWidth = borderWidth;
        context.strokeStyle = borderConfig.color;
        drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
        context.stroke();
        break;
    }
  }

  let y = textStartY;
  laidOutLines.forEach((line, index) => {
    const startX = lineStartPositions[index];

    let backgroundX = startX;
    let activeBackgroundColor = null;
    let activeBackgroundFont = null;
    let activeBackgroundStartX = 0;
    let activeBackgroundWidth = 0;
    let activeBackgroundHeight = 0;

    const flushActiveBackground = () => {
      if (!activeBackgroundColor || activeBackgroundWidth <= 0) {
        return;
      }

      const rectStartX = Math.floor(activeBackgroundStartX);
      const rectEndX = Math.ceil(activeBackgroundStartX + activeBackgroundWidth);
      const rectWidth = Math.max(1, rectEndX - rectStartX);

      context.fillStyle = activeBackgroundColor;
      context.fillRect(rectStartX, y, rectWidth, activeBackgroundHeight);
    };

    line.tokens.forEach((token) => {
      const hasBackground = Boolean(token.style.background && token.text.length > 0);

      if (hasBackground) {
        const tokenBackgroundHeight = getBackgroundRectHeightForFont(token.font, token.style.fontSize);

        if (activeBackgroundColor === token.style.background && activeBackgroundFont === token.font) {
          activeBackgroundWidth += token.width;
          activeBackgroundHeight = Math.max(activeBackgroundHeight, tokenBackgroundHeight);
        } else {
          flushActiveBackground();
          activeBackgroundColor = token.style.background;
          activeBackgroundFont = token.font;
          activeBackgroundStartX = backgroundX;
          activeBackgroundWidth = token.width;
          activeBackgroundHeight = tokenBackgroundHeight;
        }
      } else {
        flushActiveBackground();
        activeBackgroundColor = null;
        activeBackgroundFont = null;
        activeBackgroundStartX = 0;
        activeBackgroundWidth = 0;
        activeBackgroundHeight = 0;
      }

      backgroundX += token.width;
    });

    flushActiveBackground();

    let x = startX;

    line.tokens.forEach((token) => {
      context.font = token.font;
      context.fillStyle = token.style.color;
      context.fillText(token.text, x, y);

      if (token.style.underline && token.text.trim()) {
        const underlineY = y + token.style.fontSize + 2;
        const underlineWidth = Math.max(1, token.style.fontSize / 14);
        context.strokeStyle = token.style.color;
        context.lineWidth = underlineWidth;
        context.beginPath();
        context.moveTo(x, underlineY);
        context.lineTo(x + token.width, underlineY);
        context.stroke();
      }

      x += token.width;
    });

    y += line.lineHeight;
  });

}

function drawEditorToCanvas() {
  const borderConfig = getBorderConfig();
  const canvasBackgroundConfig = getCanvasBackgroundConfig();
  updateEditorBackgroundColor(borderConfig, canvasBackgroundConfig);
  const canvasSizePaddingConfig = getCanvasSizePaddingConfig();
  const configuredBaseWidth = clampToPositiveNumber(maxImageWidthInput?.value, BASE_CANVAS_CONTENT_WIDTH);
  const maxContentWidth = Math.max(
    50,
    configuredBaseWidth
      - canvasSizePaddingConfig.left
      - canvasSizePaddingConfig.right
      - (borderConfig.enabled ? borderConfig.width * 2 + borderConfig.padding.left + borderConfig.padding.right : 0),
  );

  const delta = quill.getContents();
  const lines = extractDocumentFromDelta(delta);
  const laidOutLines = layoutDocumentForCanvas(lines, maxContentWidth, isTextWrapEnabled());
  const measuredCanvasDimensions = calculateCanvasDimensions(
    laidOutLines,
    borderConfig,
    canvasSizePaddingConfig,
    maxContentWidth,
  );

  canvas.width = measuredCanvasDimensions.width;
  canvas.height = measuredCanvasDimensions.height;

  renderDocumentToCanvas(laidOutLines, borderConfig, canvasBackgroundConfig, canvasSizePaddingConfig, maxContentWidth);
}

Object.entries(imageSidePaddingControls).forEach(([side, { lock, input }]) => {
  lock.addEventListener('click', () => {
    imageLockState[side] = !imageLockState[side];
    syncImageLockedPaddingValues();
    drawEditorToCanvas();
  });

  input.addEventListener('input', () => {
    drawEditorToCanvas();
  });
});

imageCenterPaddingInput.addEventListener('input', () => {
  syncImageLockedPaddingValues();
  drawEditorToCanvas();
});

Object.entries(sidePaddingControls).forEach(([side, { lock, input }]) => {
  lock.addEventListener('click', () => {
    lockState[side] = !lockState[side];
    syncLockedPaddingValues();
    drawEditorToCanvas();
  });

  input.addEventListener('input', () => {
    drawEditorToCanvas();
  });
});

[centerPaddingInput, borderWidthInput, borderRadiusInput].forEach((input) => {
  input.addEventListener('input', () => {
    syncLockedPaddingValues();
    drawEditorToCanvas();
  });
});

Object.entries(imageBorderCornerInputs).forEach(([corner, input]) => {
  input?.addEventListener('change', () => {
    handleImageBorderFileChange('corners', corner, input);
  });
});

Object.entries(imageBorderSideInputs).forEach(([side, input]) => {
  input?.addEventListener('change', () => {
    handleImageBorderFileChange('sides', side, input);
  });
});

createInsideOutColorRow('#1f2937');
createInsideOutColorRow('#9ca3af');

insideOutAddColorButton.addEventListener('click', () => {
  addInsideOutColor();
});

[borderColorSolidRadio, borderColorInsideOutRadio, borderColorImagesRadio].forEach((radioInput) => {
  radioInput.addEventListener('change', () => {
    updateBorderColorModeUI();
    drawEditorToCanvas();
  });
});

[backgroundColorTransparentRadio, backgroundColorSolidRadio].forEach((radioInput) => {
  radioInput.addEventListener('change', () => {
    updateCanvasBackgroundControlsState();
    drawEditorToCanvas();
  });
});

borderColorInput.addEventListener('input', () => {
  syncColorPreviewButtons();
  drawEditorToCanvas();
});

[imageBorderSizingModeInput, imageBorderRepeatModeInput].forEach((input) => {
  input?.addEventListener('change', () => {
    drawEditorToCanvas();
  });
});

backgroundColorInput.addEventListener('input', () => {
  syncColorPreviewButtons();
  drawEditorToCanvas();
});

[borderBackgroundColorTransparentRadio, borderBackgroundColorSolidRadio].forEach((radioInput) => {
  radioInput.addEventListener('change', () => {
    updateBorderColorModeUI();
    drawEditorToCanvas();
  });
});

borderBackgroundColorInput.addEventListener('input', () => {
  syncColorPreviewButtons();
  drawEditorToCanvas();
});

borderToggle.addEventListener('change', () => {
  syncColorPickerUI();
  syncColorPreviewButtons();

  updateBorderControlsState();
  drawEditorToCanvas();
});

quill.on('text-change', () => {
  drawEditorToCanvas();
});

if (wrapTextInput) {
  wrapTextInput.addEventListener('change', () => {
    syncEditorWrapMode();
    drawEditorToCanvas();
  });
}

if (maxImageWidthInput) {
  maxImageWidthInput.addEventListener('input', () => {
    drawEditorToCanvas();
  });
}

saveButton.addEventListener('click', () => {
  drawEditorToCanvas();

  const rawImageName = imageNameInput?.value.trim() || 'NewImage';
  const safeImageName = rawImageName.replace(/[\/:*?"<>|]/g, '_');
  const hasExtension = /\.[^./\\\s]+$/.test(safeImageName);
  const fileName = hasExtension ? safeImageName : `${safeImageName}.png`;
  const imageData = canvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  downloadLink.href = imageData;
  downloadLink.download = fileName;
  downloadLink.click();
});

imageNameInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

  event.preventDefault();
  triggerSaveImage();
});

populateColorGrid(basicColorsGrid, basicColorPalette);
populateColorGrid(customColorsGrid, customColorPalette);

if (addCustomColorButton) {
  addCustomColorButton.addEventListener('click', handleAddCustomColor);
}


if (pickScreenColorButton) {
  pickScreenColorButton.addEventListener('click', async () => {
    if (!window.EyeDropper || colorPickerState.isPickingFromScreen) {
      return;
    }

    pickScreenColorButton.disabled = true;
    await pickColorFromScreen();
  });

  if (!window.EyeDropper) {
    pickScreenColorButton.disabled = true;
    pickScreenColorButton.title = 'Your browser does not support screen color picking.';
  }
}



if (openBackgroundColorWindowButton) {
  openBackgroundColorWindowButton.addEventListener('click', openBackgroundColorWindow);
}

if (backgroundColorWindowButton) {
  backgroundColorWindowButton.addEventListener('click', () => {
    openColorWindowForInput(backgroundColorInput, 'Image Background Color');
  });
}

if (borderColorWindowButton) {
  borderColorWindowButton.addEventListener('click', () => {
    openColorWindowForInput(borderColorInput, 'Border Color');
  });
}

if (borderBackgroundColorWindowButton) {
  borderBackgroundColorWindowButton.addEventListener('click', () => {
    openColorWindowForInput(borderBackgroundColorInput, 'Border Background Color');
  });
}

if (closeColorWindowButton) {
  closeColorWindowButton.addEventListener('click', closeColorWindow);
}

if (colorWindowOverlay) {
  colorWindowOverlay.addEventListener('click', (event) => {
    if (event.target === colorWindowOverlay) {
      closeColorWindow();
    }
  });
}

if (canvasPanel) {
  canvasPanel.addEventListener('wheel', forwardCanvasPanelScrollToFormPanel, { passive: false });
}


if (colorMap) {
  colorMap.addEventListener('pointerdown', (event) => {
    colorPickerState.dragTarget = 'map';
    colorMap.setPointerCapture(event.pointerId);
    updateMapFromPointer(event);
  });

  colorMap.addEventListener('pointermove', (event) => {
    if (colorPickerState.dragTarget === 'map') {
      updateMapFromPointer(event);
    }
  });

  colorMap.addEventListener('pointerup', (event) => {
    colorPickerState.dragTarget = null;
    colorMap.releasePointerCapture(event.pointerId);
  });
}

if (colorSlider) {
  colorSlider.addEventListener('pointerdown', (event) => {
    colorPickerState.dragTarget = 'slider';
    colorSlider.setPointerCapture(event.pointerId);
    updateHueFromPointer(event);
  });

  colorSlider.addEventListener('pointermove', (event) => {
    if (colorPickerState.dragTarget === 'slider') {
      updateHueFromPointer(event);
    }
  });

  colorSlider.addEventListener('pointerup', (event) => {
    colorPickerState.dragTarget = null;
    colorSlider.releasePointerCapture(event.pointerId);
  });
}

if (colorValueInputs.hue) {
  colorValueInputs.hue.addEventListener('input', () => {
    colorPickerState.hue = clampNumber(colorValueInputs.hue.value, 0, 360, colorPickerState.hue);
    syncColorPickerUI();
  });
  colorValueInputs.sat.addEventListener('input', () => {
    colorPickerState.sat = clampNumber(colorValueInputs.sat.value, 0, 255, colorPickerState.sat);
    syncColorPickerUI();
  });
  colorValueInputs.val.addEventListener('input', () => {
    colorPickerState.val = clampNumber(colorValueInputs.val.value, 0, 255, colorPickerState.val);
    syncColorPickerUI();
  });

  ['red', 'green', 'blue', 'alpha'].forEach((key) => {
    colorValueInputs[key].addEventListener('input', () => {
      const red = clampNumber(colorValueInputs.red.value, 0, 255, 0);
      const green = clampNumber(colorValueInputs.green.value, 0, 255, 0);
      const blue = clampNumber(colorValueInputs.blue.value, 0, 255, 0);
      const hsv = rgbToHsv(red, green, blue);
      colorPickerState.hue = hsv.hue;
      colorPickerState.sat = hsv.sat;
      colorPickerState.val = hsv.val;
      colorPickerState.alpha = clampNumber(colorValueInputs.alpha.value, 0, 255, colorPickerState.alpha);
      syncColorPickerUI();
    });
  });

  colorValueInputs.hex.addEventListener('change', () => {
    const rgb = hexToRgb(colorValueInputs.hex.value);
    if (!rgb) {
      syncColorPickerUI();
      return;
    }

    const hsv = rgbToHsv(rgb.red, rgb.green, rgb.blue);
    colorPickerState.hue = hsv.hue;
    colorPickerState.sat = hsv.sat;
    colorPickerState.val = hsv.val;
    colorPickerState.alpha = rgb.alpha ?? 255;
    syncColorPickerUI();
  });
}

if (colorWindowOkButton) {
  colorWindowOkButton.addEventListener('click', () => {
    applyDraftColorFromWindow();
  });
}

if (colorWindowCancelButton) {
  colorWindowCancelButton.addEventListener('click', () => {
    closeColorWindow();
  });
}

if (settingsButton) {
  settingsButton.addEventListener('click', openSettingsWindow);
}

if (closeSettingsWindowButton) {
  closeSettingsWindowButton.addEventListener('click', closeSettingsWindow);
}

if (settingsOverlay) {
  settingsOverlay.addEventListener('click', (event) => {
    if (event.target === settingsOverlay) {
      closeSettingsWindow();
    }
  });
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('change', () => {
    applyDarkMode(darkModeToggle.checked);
    persistSettings();
  });
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeColorWindow();
    closeSettingsWindow();
  }
});

if (appVersionBadge) {
  appVersionBadge.textContent = APP_VERSION;
}

syncColorPickerUI();
syncColorPreviewButtons();
applySavedSettings();

updateBorderControlsState();
syncImageLockedPaddingValues();
updateCanvasBackgroundControlsState();
syncEditorWrapMode();
drawEditorToCanvas();
