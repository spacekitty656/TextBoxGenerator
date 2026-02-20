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
import { createImageLibraryStore } from './images/libraryStore.js';
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
const APP_VERSION = '1.1.9';
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
const imageBorderCornerButtons = {
  topLeft: document.getElementById('image-border-corner-top-left'),
  topRight: document.getElementById('image-border-corner-top-right'),
  bottomRight: document.getElementById('image-border-corner-bottom-right'),
  bottomLeft: document.getElementById('image-border-corner-bottom-left'),
};
const imageBorderSideButtons = {
  top: document.getElementById('image-border-side-top'),
  right: document.getElementById('image-border-side-right'),
  bottom: document.getElementById('image-border-side-bottom'),
  left: document.getElementById('image-border-side-left'),
};
const imageBorderTransformInputs = {
  corners: {
    topLeft: {
      rotation: document.getElementById('image-border-corner-top-left-rotation'),
      flipX: document.getElementById('image-border-corner-top-left-flip-x'),
      flipY: document.getElementById('image-border-corner-top-left-flip-y'),
      clear: document.getElementById('image-border-corner-top-left-clear'),
    },
    topRight: {
      rotation: document.getElementById('image-border-corner-top-right-rotation'),
      flipX: document.getElementById('image-border-corner-top-right-flip-x'),
      flipY: document.getElementById('image-border-corner-top-right-flip-y'),
      clear: document.getElementById('image-border-corner-top-right-clear'),
    },
    bottomRight: {
      rotation: document.getElementById('image-border-corner-bottom-right-rotation'),
      flipX: document.getElementById('image-border-corner-bottom-right-flip-x'),
      flipY: document.getElementById('image-border-corner-bottom-right-flip-y'),
      clear: document.getElementById('image-border-corner-bottom-right-clear'),
    },
    bottomLeft: {
      rotation: document.getElementById('image-border-corner-bottom-left-rotation'),
      flipX: document.getElementById('image-border-corner-bottom-left-flip-x'),
      flipY: document.getElementById('image-border-corner-bottom-left-flip-y'),
      clear: document.getElementById('image-border-corner-bottom-left-clear'),
    },
  },
  sides: {
    top: {
      rotation: document.getElementById('image-border-side-top-rotation'),
      flipX: document.getElementById('image-border-side-top-flip-x'),
      flipY: document.getElementById('image-border-side-top-flip-y'),
      clear: document.getElementById('image-border-side-top-clear'),
    },
    right: {
      rotation: document.getElementById('image-border-side-right-rotation'),
      flipX: document.getElementById('image-border-side-right-flip-x'),
      flipY: document.getElementById('image-border-side-right-flip-y'),
      clear: document.getElementById('image-border-side-right-clear'),
    },
    bottom: {
      rotation: document.getElementById('image-border-side-bottom-rotation'),
      flipX: document.getElementById('image-border-side-bottom-flip-x'),
      flipY: document.getElementById('image-border-side-bottom-flip-y'),
      clear: document.getElementById('image-border-side-bottom-clear'),
    },
    left: {
      rotation: document.getElementById('image-border-side-left-rotation'),
      flipX: document.getElementById('image-border-side-left-flip-x'),
      flipY: document.getElementById('image-border-side-left-flip-y'),
      clear: document.getElementById('image-border-side-left-clear'),
    },
  },
};
const manageImagesOverlay = document.getElementById('manage-images-overlay');
const closeManageImagesWindowButton = document.getElementById('close-manage-images-window');
const manageImagesInput = document.getElementById('manage-images-input');
const manageImagesList = document.getElementById('manage-images-list');
const manageImagesOkButton = document.getElementById('manage-images-ok');
const manageImagesCancelButton = document.getElementById('manage-images-cancel');

const insideOutColorInputs = [];

function createImageBorderSlotState() {
  return {
    imageId: null,
    rotation: 0,
    flipX: false,
    flipY: false,
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

  slotState.imageId = null;
}

const imageLibraryStore = createImageLibraryStore();
let activeImageSlotSelection = null;
let pendingSlotSelection = null;

function getManagedImageById(imageId) {
  return imageLibraryStore.getImage(imageId);
}

function assignManagedImageToSlot(slotType, slotName, imageId) {
  const slotState = getImageBorderSlotState(slotType, slotName);

  if (!slotState) {
    return;
  }

  const selectedImage = getManagedImageById(imageId);

  if (!selectedImage) {
    clearImageBorderSlot(slotState);
    return;
  }

  slotState.imageId = selectedImage.id;
}

function getPieceButton(slotType, slotName) {
  return slotType === 'corners'
    ? imageBorderCornerButtons[slotName]
    : imageBorderSideButtons[slotName];
}

function toCompactPieceLabel(sourceName) {
  if (!sourceName) {
    return 'No image';
  }

  const trimmed = sourceName.trim();
  const extensionIndex = trimmed.lastIndexOf('.');
  const hasExtension = extensionIndex > 0;
  const baseName = hasExtension ? trimmed.slice(0, extensionIndex) : trimmed;
  const extension = hasExtension ? trimmed.slice(extensionIndex) : '';

  const compactBase = baseName.length > 12
    ? `${baseName.slice(0, 12)}…`
    : baseName;

  const compactExtension = extension.length > 6
    ? extension.slice(0, 6)
    : extension;

  return `${compactBase}${compactExtension}`;
}

function updatePieceButtonLabel(slotType, slotName) {
  const slotState = getImageBorderSlotState(slotType, slotName);
  const button = getPieceButton(slotType, slotName);

  if (!button || !slotState) {
    return;
  }

  const imageEntry = slotState?.imageId ? getManagedImageById(slotState.imageId) : null;
  const sourceName = imageEntry?.name || '';
  button.textContent = toCompactPieceLabel(sourceName);
  button.title = sourceName || 'Select image';
}

function updateAllPieceButtonLabels() {
  Object.keys(imageBorderCornerButtons).forEach((slotName) => {
    updatePieceButtonLabel('corners', slotName);
  });

  Object.keys(imageBorderSideButtons).forEach((slotName) => {
    updatePieceButtonLabel('sides', slotName);
  });
}

async function addManagedImagesFromFileList(fileList) {
  const files = Array.from(fileList || []).filter((file) => file?.type?.startsWith('image/'));

  for (const file of files) {
    try {
      const loadedImage = await loadImageFromFile(file);
      imageLibraryStore.createImage({
        name: file.name,
        image: loadedImage,
      });
    } catch (error) {
      console.error('Unable to load selected image.', error);
    }
  }

  renderManageImagesList();
}

function renderManageImagesList() {
  if (!manageImagesList) {
    return;
  }

  manageImagesList.innerHTML = '';
  imageLibraryStore.listAllImages().forEach((imageEntry) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'manage-image-item';
    row.dataset.imageId = imageEntry.id;
    row.textContent = imageEntry.name;

    if (pendingSlotSelection === imageEntry.id) {
      row.classList.add('active');
    }

    row.addEventListener('click', () => {
      pendingSlotSelection = imageEntry.id;
      manageImagesList.querySelectorAll('.manage-image-item').forEach((item) => item.classList.remove('active'));
      row.classList.add('active');
    });

    row.addEventListener('dblclick', () => {
      pendingSlotSelection = imageEntry.id;
      applyManageImagesSelection();
    });

    manageImagesList.appendChild(row);
  });
}

function closeManageImagesWindow() {
  if (!manageImagesOverlay) {
    return;
  }

  manageImagesOverlay.classList.add('hidden');
  manageImagesOverlay.setAttribute('aria-hidden', 'true');
  activeImageSlotSelection = null;
  pendingSlotSelection = null;
}

function openManageImagesWindow(slotType = null, slotName = null) {
  if (!manageImagesOverlay) {
    return;
  }

  activeImageSlotSelection = slotType && slotName ? { slotType, slotName } : null;
  pendingSlotSelection = activeImageSlotSelection
    ? (getImageBorderSlotState(activeImageSlotSelection.slotType, activeImageSlotSelection.slotName)?.imageId || null)
    : null;
  renderManageImagesList();
  manageImagesOverlay.classList.remove('hidden');
  manageImagesOverlay.setAttribute('aria-hidden', 'false');
}

function applyManageImagesSelection() {
  if (activeImageSlotSelection && pendingSlotSelection) {
    assignManagedImageToSlot(activeImageSlotSelection.slotType, activeImageSlotSelection.slotName, pendingSlotSelection);

    updatePieceButtonLabel(activeImageSlotSelection.slotType, activeImageSlotSelection.slotName);
    drawEditorToCanvas();
  }

  closeManageImagesWindow();
}

function updateImageBorderSlotInputsState(isImageModeActive) {
  [
    ...Object.values(imageBorderCornerButtons),
    ...Object.values(imageBorderSideButtons),
  ].forEach((input) => {
    if (input) {
      input.disabled = !isImageModeActive;
    }
  });

  Object.values(imageBorderTransformInputs).forEach((group) => {
    Object.values(group).forEach((controls) => {
      controls.rotation.disabled = !isImageModeActive;
      controls.flipX.disabled = !isImageModeActive;
      controls.flipY.disabled = !isImageModeActive;
      controls.clear.disabled = !isImageModeActive;
    });
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
  const resolveRenderableImageSlot = (slot) => {
    const imageEntry = slot?.imageId ? getManagedImageById(slot.imageId) : null;

    if (!imageEntry?.image) {
      return {
        ...slot,
        image: null,
        status: 'empty',
      };
    }

    return {
      ...slot,
      image: imageEntry.image,
      status: 'ready',
    };
  };

  const resolveRenderableSlotGroup = (slotGroup) => Object.fromEntries(
    Object.entries(slotGroup).map(([slotName, slot]) => [slotName, resolveRenderableImageSlot(slot)]),
  );

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
      corners: resolveRenderableSlotGroup(imageBorderState.corners),
      sides: resolveRenderableSlotGroup(imageBorderState.sides),
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
    borderX = renderedMinX - textPadding.left - borderWidth / 2;
    borderY = verticalBounds.minY - textPadding.top - borderWidth / 2;
    borderRectWidth = renderedMaxX - renderedMinX + textPadding.left + textPadding.right + borderWidth;
    borderRectHeight = verticalBounds.maxY - verticalBounds.minY + textPadding.top + textPadding.bottom + borderWidth;

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

Object.entries(imageBorderCornerButtons).forEach(([corner, button]) => {
  button?.addEventListener('click', () => {
    openManageImagesWindow('corners', corner);
  });
});

Object.entries(imageBorderSideButtons).forEach(([side, button]) => {
  button?.addEventListener('click', () => {
    openManageImagesWindow('sides', side);
  });
});

Object.entries(imageBorderTransformInputs).forEach(([slotType, group]) => {
  Object.entries(group).forEach(([slotName, controls]) => {
    controls.rotation?.addEventListener('change', () => {
      const slotState = getImageBorderSlotState(slotType, slotName);
      if (!slotState) {
        return;
      }
      slotState.rotation = Number.parseInt(controls.rotation.value, 10) || 0;
      drawEditorToCanvas();
    });

    controls.flipX?.addEventListener('change', () => {
      const slotState = getImageBorderSlotState(slotType, slotName);
      if (!slotState) {
        return;
      }
      slotState.flipX = controls.flipX.checked;
      drawEditorToCanvas();
    });

    controls.flipY?.addEventListener('change', () => {
      const slotState = getImageBorderSlotState(slotType, slotName);
      if (!slotState) {
        return;
      }
      slotState.flipY = controls.flipY.checked;
      drawEditorToCanvas();
    });

    controls.clear?.addEventListener('click', () => {
      const slotState = getImageBorderSlotState(slotType, slotName);
      clearImageBorderSlot(slotState);

      updatePieceButtonLabel(slotType, slotName);
      drawEditorToCanvas();
    });
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


if (manageImagesInput) {
  manageImagesInput.addEventListener('change', async () => {
    await addManagedImagesFromFileList(manageImagesInput.files);
    manageImagesInput.value = '';
  });
}

if (closeManageImagesWindowButton) {
  closeManageImagesWindowButton.addEventListener('click', () => {
    closeManageImagesWindow();
  });
}

if (manageImagesCancelButton) {
  manageImagesCancelButton.addEventListener('click', () => {
    closeManageImagesWindow();
  });
}

if (manageImagesOkButton) {
  manageImagesOkButton.addEventListener('click', () => {
    applyManageImagesSelection();
  });
}

if (manageImagesOverlay) {
  manageImagesOverlay.addEventListener('click', (event) => {
    if (event.target === manageImagesOverlay) {
      closeManageImagesWindow();
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
    closeManageImagesWindow();
  }

  if (event.key === 'Enter' && manageImagesOverlay && !manageImagesOverlay.classList.contains('hidden')) {
    event.preventDefault();
    applyManageImagesSelection();
  }
});

if (appVersionBadge) {
  appVersionBadge.textContent = APP_VERSION;
}

syncColorPickerUI();
syncColorPreviewButtons();
applySavedSettings();
updateAllPieceButtonLabels();

updateBorderControlsState();
syncImageLockedPaddingValues();
updateCanvasBackgroundControlsState();
syncEditorWrapMode();
drawEditorToCanvas();
