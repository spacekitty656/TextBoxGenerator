import {
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
  getImageBorderSlotState as getImageBorderSlotStateModule,
} from './border/imageBorder.js';
import {
  assignImageBorderSlot,
  clearImageBorderSlot,
  createImageBorderSlotState,
  resolveRenderableImageBorderGroup,
} from './border/imageBorderState.js';
import { createImageLibraryStore } from './images/libraryStore.js';
import { createImageLibraryService } from './images/imageLibraryService.js';
import { createQuillEditor } from './editor/quillAdapter.js';
import { createDeltaAdapter } from './editor/deltaAdapter.js';
import { createManageImagesWindowController } from './ui/manageImagesWindow.js';
import { createCanvasPainter } from './render/canvasPainter.js';
import { createBackgroundRectHeightForFont, createLayoutAdapter, registerCanvasFontFamily } from './render/layoutAdapter.js';
import { createRenderOrchestrator } from './render/renderOrchestrator.js';
import { createBorderControlsView } from './ui/views/borderControlsView.js';
import { createColorPickerView } from './ui/views/colorPickerView.js';
import { createEditorView } from './ui/views/editorView.js';
import { createManageImagesView } from './ui/views/manageImagesView.js';
import { createLoadBorderTemplateView } from './ui/views/loadBorderTemplateView.js';
import { createSaveBorderTemplateView } from './ui/views/saveBorderTemplateView.js';
import { createSettingsView } from './ui/views/settingsView.js';
import { createManageFontsView } from './ui/views/manageFontsView.js';
import { createColorPickerController } from './controllers/colorPickerController.js';
import { createEditorController } from './controllers/editorController.js';
import { createManageImagesController } from './controllers/manageImagesController.js';
import { createSettingsController } from './controllers/settingsController.js';
import { createBorderState } from './features/border/borderState.js';
import { createBorderUiController } from './features/border/borderUiController.js';
import { createBorderTemplateFeature } from './features/border/borderTemplateFeature.js';
import { createBorderTemplateAdapterService } from './features/border/borderTemplateAdapterService.js';
import { createFontLibraryStore } from './fonts/fontLibraryStore.js';
import {
  persistFontLibraryToIndexedDb,
  restoreFontLibraryFromIndexedDb,
} from './fonts/fontPersistenceIndexedDb.js';
import { createManageFontsWindowController } from './ui/manageFontsWindow.js';

const Quill = window.Quill;

const editorView = createEditorView(document);
const settingsView = createSettingsView(document);
const borderControlsView = createBorderControlsView(document);
const manageImagesView = createManageImagesView(document);
const loadBorderTemplateView = createLoadBorderTemplateView(document);
const saveBorderTemplateView = createSaveBorderTemplateView(document);
const manageFontsView = createManageFontsView(document);
const colorPickerView = createColorPickerView(document);

const canvas = editorView.canvas.preview;
const context = canvas.getContext('2d');
const editorElement = editorView.editor.root;
const saveButton = editorView.output.saveButton;
const imageNameInput = editorView.output.imageNameInput;
const appVersionBadge = editorView.output.appVersionBadge;
const storageStatusMessage = editorView.output.storageStatusMessage;
const settingsButton = settingsView.window.openButton;
const settingsOverlay = settingsView.window.overlay;
const closeSettingsWindowButton = settingsView.window.closeButton;
const darkModeToggle = settingsView.preferences.darkModeToggle;
const APP_VERSION = '1.1.9';
const BASE_CANVAS_CONTENT_WIDTH = 900;
const SETTINGS_STORAGE_KEY = DEFAULT_SETTINGS_STORAGE_KEY;

const borderToggle = borderControlsView.toggles.borderToggle;
const borderOptions = borderControlsView.toggles.borderOptions;
const borderWidthInput = borderControlsView.borderStyle.widthInput;
const borderRadiusInput = borderControlsView.borderStyle.radiusInput;
const borderTemplateLoadButton = borderControlsView.borderStyle.templateLoadButton;
const borderTemplateSaveAsButton = borderControlsView.borderStyle.templateSaveAsButton;
const borderTemplatePathLabel = borderControlsView.borderStyle.templatePath;
const borderColorSolidRadio = borderControlsView.colorModes.borderColorSolidRadio;
const borderColorInsideOutRadio = borderControlsView.colorModes.borderColorInsideOutRadio;
const borderColorImagesRadio = borderControlsView.colorModes.borderColorImagesRadio;
const borderColorInput = borderControlsView.borderStyle.borderColorInput;
const backgroundColorTransparentRadio = borderControlsView.colorModes.backgroundColorTransparentRadio;
const backgroundColorSolidRadio = borderControlsView.colorModes.backgroundColorSolidRadio;
const backgroundColorInput = borderControlsView.borderStyle.backgroundColorInput;
const borderBackgroundColorTransparentRadio = borderControlsView.colorModes.borderBackgroundColorTransparentRadio;
const borderBackgroundColorSolidRadio = borderControlsView.colorModes.borderBackgroundColorSolidRadio;
const borderBackgroundColorInput = borderControlsView.borderStyle.borderBackgroundColorInput;
const insideOutColors = borderControlsView.insideOut.colorsContainer;
const insideOutColorList = borderControlsView.insideOut.colorList;
const insideOutAddColorButton = borderControlsView.insideOut.addColorButton;
const imageBorderControls = borderControlsView.imageBorder.controls;
const imageBorderSizingModeInput = borderControlsView.imageBorder.sizingModeInput;
const imageBorderRepeatModeInput = borderControlsView.imageBorder.repeatModeInput;
const imageBorderCornerButtons = borderControlsView.imageBorder.cornerButtons;
const imageBorderSideButtons = borderControlsView.imageBorder.sideButtons;
const imageBorderTransformInputs = borderControlsView.imageBorder.transformInputs;

const manageImagesOverlay = manageImagesView.window.overlay;
const closeManageImagesWindowButton = manageImagesView.window.closeButton;
const manageImagesInput = manageImagesView.tree.input;
const manageImagesRefreshInput = manageImagesView.tree.refreshInput;
const manageImagesTree = manageImagesView.tree.tree;
const manageImagesContextMenu = manageImagesView.tree.contextMenu;
const manageImagesImportButton = manageImagesView.actions.importButton;
const manageImagesCreateFolderButton = manageImagesView.actions.createFolderButton;
const manageImagesRefreshButton = manageImagesView.actions.refreshButton;
const manageImagesRenameButton = manageImagesView.actions.renameButton;
const manageImagesDeleteButton = manageImagesView.actions.deleteButton;
const manageImagesOkButton = manageImagesView.window.okButton;
const manageImagesCancelButton = manageImagesView.window.cancelButton;


const manageFontsOverlay = manageFontsView.window.overlay;
const closeManageFontsWindowButton = manageFontsView.window.closeButton;
const manageFontsOkButton = manageFontsView.window.okButton;
const manageFontsInput = manageFontsView.tree.input;
const manageFontsTree = manageFontsView.tree.tree;
const manageFontsButton = manageFontsView.window.openButton;
const manageFontsImportButton = manageFontsView.actions.importButton;
const manageFontsCreateFolderButton = manageFontsView.actions.createFolderButton;
const manageFontsRenameButton = manageFontsView.actions.renameButton;
const manageFontsDeleteButton = manageFontsView.actions.deleteButton;


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

const centerPaddingInput = editorView.padding.text.centerInput;
const sidePaddingControls = editorView.padding.text.sides;

const wrapTextInput = editorView.editor.wrapTextInput;
const maxImageWidthInput = editorView.editor.maxImageWidthInput;
const fontSelectInput = document.querySelector('#editor-toolbar .ql-font');
const fontSizeInput = document.getElementById('font-size-input');
const fontSizeDropdownButton = document.getElementById('font-size-dropdown-button');
const fontSizeDropdown = document.getElementById('font-size-dropdown');
const colorWindowOverlay = colorPickerView.window.overlay;
const closeColorWindowButton = colorPickerView.window.closeButton;
const basicColorsGrid = colorPickerView.grids.basicColors;
const customColorsGrid = colorPickerView.grids.customColors;
const canvasPanel = editorView.canvas.panel;
const formPanel = editorView.editor.formPanel;
const addCustomColorButton = colorPickerView.grids.addCustomColorButton;
const pickScreenColorButton = colorPickerView.grids.pickScreenColorButton;
const openBackgroundColorWindowButton = colorPickerView.triggerButtons.openBackgroundColorWindowButton;
const backgroundColorWindowButton = colorPickerView.triggerButtons.backgroundColorWindowButton;
const borderColorWindowButton = colorPickerView.triggerButtons.borderColorWindowButton;
const borderBackgroundColorWindowButton = colorPickerView.triggerButtons.borderBackgroundColorWindowButton;

const colorMap = colorPickerView.picker.colorMap;
const colorMapHandle = colorPickerView.picker.colorMapHandle;
const colorSlider = colorPickerView.picker.colorSlider;
const colorSliderHandle = colorPickerView.picker.colorSliderHandle;
const selectedColorPreview = colorPickerView.picker.selectedColorPreview;
const colorWindowTitle = colorPickerView.window.title;
const colorValueInputs = colorPickerView.picker.valueInputs;
const colorWindowOkButton = colorPickerView.window.okButton;
const colorWindowCancelButton = colorPickerView.window.cancelButton;

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

function setStorageStatusMessage(message = '', isError = false) {
  if (!storageStatusMessage) {
    return;
  }

  storageStatusMessage.textContent = message;
  storageStatusMessage.classList.toggle('hidden', !message);
  storageStatusMessage.classList.toggle('status-message-error', Boolean(message) && isError);
}

function persistImageLibrary() {
  imageLibraryService.persist(imageLibraryStore);
}

async function persistFontLibraryState() {
  const status = await persistFontLibraryToIndexedDb(fontLibraryStore);
  if (!status?.ok && status?.error) {
    console.warn('Unable to persist font library to IndexedDB.', status.error);
  }
}

async function initializeFontLibraryFromPersistence() {
  try {
    const snapshot = await restoreFontLibraryFromIndexedDb();
    if (snapshot) {
      fontLibraryStore.deserialize(snapshot);
      refreshFontRegistry();
      drawEditorToCanvas();
    }
  } catch (error) {
    console.warn('Unable to initialize font library persistence.', error);
  }
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

const imageCenterPaddingInput = editorView.padding.image.centerInput;
const imageSidePaddingControls = editorView.padding.image.sides;

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

const fontLibraryStore = createFontLibraryStore();
const FONT_SIZE_OPTIONS = [4, 6, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 144];
const FONT_SIZE_STYLE_WHITELIST = Array.from({ length: 999 }, (_, index) => `${index + 1}px`);
const loadedFontFaceValues = new Set();
let quill = null;

function listAvailableFonts() {
  return fontLibraryStore.listTemplatesByClass('font');
}

async function ensureFontFaceLoaded(fontEntry) {
  const fontValue = fontEntry?.data?.value;
  const sourceDataUrl = fontEntry?.data?.sourceDataUrl;
  const familyName = fontEntry?.data?.familyName;

  if (!fontValue || !sourceDataUrl || !familyName || loadedFontFaceValues.has(fontValue)) {
    return;
  }

  try {
    const fontFace = new FontFace(familyName, `url("${sourceDataUrl}")`);
    await fontFace.load();
    document.fonts.add(fontFace);
    loadedFontFaceValues.add(fontValue);
  } catch (error) {
    console.error('Unable to restore imported font from persisted data.', error);
  }
}

function syncFontPickerOptions(fonts) {
  if (!fontSelectInput) {
    return;
  }

  const previousValue = fontSelectInput.value;
  fontSelectInput.innerHTML = '';
  fonts.forEach((fontEntry) => {
    const option = document.createElement('option');
    option.value = fontEntry.data.value;
    option.textContent = fontEntry.name;
    option.setAttribute('data-label', fontEntry.name);
    fontSelectInput.appendChild(option);
  });

  const fallbackValue = fonts[0]?.data?.value || '';
  const selectedValue = fonts.some((entry) => entry?.data?.value === previousValue) ? previousValue : fallbackValue;
  if (selectedValue) {
    fontSelectInput.value = selectedValue;
  }

  const picker = document.querySelector('#editor-toolbar .ql-picker.ql-font');
  const pickerLabel = picker?.querySelector('.ql-picker-label');
  const pickerOptions = picker?.querySelector('.ql-picker-options');

  if (pickerOptions) {
    pickerOptions.innerHTML = '';
    fonts.forEach((fontEntry) => {
      const fontValue = fontEntry.data.value;
      const pickerItem = document.createElement('span');
      pickerItem.className = 'ql-picker-item';
      pickerItem.setAttribute('data-value', fontValue);
      pickerItem.setAttribute('data-label', fontEntry.name);
      pickerItem.setAttribute('tabindex', '0');
      pickerItem.addEventListener('mousedown', (event) => {
        event.preventDefault();
      });
      pickerItem.addEventListener('click', () => {
        fontSelectInput.value = fontValue;
        pickerLabel?.setAttribute('data-value', fontValue);
        picker?.classList.remove('ql-expanded');

        if (quill) {
          quill.focus();
          quill.format('font', fontValue, 'user');
        }
      });
      pickerOptions.appendChild(pickerItem);
    });
  }

  if (pickerLabel) {
    pickerLabel.setAttribute('data-value', fontSelectInput.value || '');
  }
}

function refreshFontRegistry() {
  const fonts = listAvailableFonts();
  const whitelist = [];

  fonts.forEach((fontEntry) => {
    const value = fontEntry?.data?.value;
    const family = fontEntry?.data?.family;
    if (!value || !family) {
      return;
    }

    whitelist.push(value);
    registerCanvasFontFamily(value, family);
    ensureFontFaceLoaded(fontEntry);
  });

  const QuillFont = Quill.import('formats/font');
  QuillFont.whitelist = whitelist;
  Quill.register(QuillFont, true);
  syncFontPickerOptions(fonts);
}

refreshFontRegistry();

const QuillSize = Quill.import('attributors/style/size');
QuillSize.whitelist = FONT_SIZE_STYLE_WHITELIST;
Quill.register(QuillSize, true);

quill = createQuillEditor(Quill, {
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

let activeFontSize = 18;
let lastKnownSelection = null;
let isEditingFontSizeInput = false;

function setFontSizeInputValue(value) {
  if (!fontSizeInput) {
    return;
  }

  const nextValue = String(value);
  fontSizeInput.value = nextValue;
  fontSizeInput.setAttribute('value', nextValue);
}

function resolveSelectedFontSize() {
  const selection = quill.getSelection() || lastKnownSelection;
  const formats = selection ? quill.getFormat(selection) : quill.getFormat();
  const numericSize = Number.parseInt(formats.size, 10);
  if (Number.isFinite(numericSize) && numericSize > 0) {
    activeFontSize = numericSize;
    return numericSize;
  }

  if (formats.size === 'small') {
    activeFontSize = 14;
    return 14;
  }

  if (formats.size === 'large') {
    activeFontSize = 24;
    return 24;
  }

  if (formats.size === 'huge') {
    activeFontSize = 32;
    return 32;
  }

  return activeFontSize;
}

function closeFontSizeDropdown() {
  if (!fontSizeDropdown || !fontSizeDropdownButton) {
    return;
  }

  fontSizeDropdown.classList.add('hidden');
  fontSizeDropdownButton.setAttribute('aria-expanded', 'false');
}

function applyFontSize(sizeValue) {
  const requestedSize = Number.parseInt(sizeValue, 10);
  if (!Number.isFinite(requestedSize) || requestedSize <= 0) {
    setFontSizeInputValue(resolveSelectedFontSize());
    return;
  }

  const clampedSize = Math.min(999, requestedSize);
  const sizeToken = `${clampedSize}px`;
  const selection = quill.getSelection() || lastKnownSelection;
  activeFontSize = clampedSize;

  if (selection && Number.isFinite(selection.index) && selection.length > 0) {
    quill.formatText(selection.index, selection.length, 'size', sizeToken, 'user');
    quill.setSelection(selection.index, selection.length, 'silent');
  } else if (selection && Number.isFinite(selection.index)) {
    quill.setSelection(selection.index, selection.length || 0, 'silent');
    quill.format('size', sizeToken, 'user');
  } else {
    quill.format('size', sizeToken, 'user');
  }

  setFontSizeInputValue(clampedSize);
}

function syncFontSizeInputFromSelection() {
  if (!fontSizeInput || isEditingFontSizeInput) {
    return;
  }

  setFontSizeInputValue(resolveSelectedFontSize());
}

function populateFontSizeDropdown() {
  if (!fontSizeDropdown) {
    return;
  }

  fontSizeDropdown.innerHTML = '';
  FONT_SIZE_OPTIONS.forEach((fontSize) => {
    const option = document.createElement('li');
    option.className = 'font-size-dropdown-option';
    option.setAttribute('role', 'option');
    option.textContent = String(fontSize);
    option.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    option.addEventListener('click', () => {
      applyFontSize(fontSize);
      isEditingFontSizeInput = false;
      closeFontSizeDropdown();
      fontSizeInput?.focus();
    });
    fontSizeDropdown.appendChild(option);
  });
}

populateFontSizeDropdown();
syncFontSizeInputFromSelection();

fontSizeInput?.addEventListener('focus', () => {
  isEditingFontSizeInput = true;
  fontSizeInput.select();
});

fontSizeInput?.addEventListener('mousedown', (event) => {
  event.stopPropagation();
});

fontSizeInput?.addEventListener('click', (event) => {
  event.stopPropagation();
});

fontSizeDropdownButton?.addEventListener('mousedown', (event) => {
  event.stopPropagation();
});

fontSizeDropdown?.addEventListener('mousedown', (event) => {
  event.stopPropagation();
});

fontSizeInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    isEditingFontSizeInput = false;
    applyFontSize(fontSizeInput.value);
    closeFontSizeDropdown();
    fontSizeInput.blur();
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    isEditingFontSizeInput = false;
    setFontSizeInputValue(resolveSelectedFontSize());
    closeFontSizeDropdown();
    fontSizeInput.blur();
  }
});

fontSizeInput?.addEventListener('blur', () => {
  isEditingFontSizeInput = false;
  applyFontSize(fontSizeInput.value);
});

fontSizeDropdownButton?.addEventListener('click', () => {
  if (!fontSizeDropdown) {
    return;
  }

  const isExpanded = !fontSizeDropdown.classList.contains('hidden');
  if (isExpanded) {
    closeFontSizeDropdown();
    return;
  }

  fontSizeDropdown.classList.remove('hidden');
  fontSizeDropdownButton.setAttribute('aria-expanded', 'true');
});

document.addEventListener('mousedown', (event) => {
  if (!fontSizeDropdown || !fontSizeInput || !fontSizeDropdownButton) {
    return;
  }

  const clickTarget = event.target;
  if (!(clickTarget instanceof Node)) {
    return;
  }

  if (fontSizeDropdown.contains(clickTarget)
      || fontSizeInput.contains(clickTarget)
      || fontSizeDropdownButton.contains(clickTarget)) {
    return;
  }

  closeFontSizeDropdown();
});

quill.on('selection-change', (range) => {
  if (range) {
    lastKnownSelection = range;
  }
  syncFontSizeInputFromSelection();
});

quill.on('text-change', () => {
  syncFontSizeInputFromSelection();
});

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





function getImageBorderSlotState(slotType, slotName) {
  return getImageBorderSlotStateModule(imageBorderState, slotType, slotName);
}

const imageLibraryStore = createImageLibraryStore();
const imageLibraryService = createImageLibraryService({
  setStorageStatusMessage,
});

function toFontValue(name) {
  return String(name || 'font')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'font';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

async function importFontFromFile(file) {
  if (!file) {
    return null;
  }

  const baseName = String(file.name || 'Imported Font').replace(/\.[^.]+$/, '').trim() || 'Imported Font';
  let value = toFontValue(baseName);
  const usedValues = new Set(listAvailableFonts().map((entry) => entry?.data?.value).filter(Boolean));
  let counter = 2;
  while (usedValues.has(value)) {
    value = `${toFontValue(baseName)}-${counter}`;
    counter += 1;
  }

  let sourceDataUrl = null;

  try {
    const [arrayBuffer, dataUrl] = await Promise.all([
      file.arrayBuffer(),
      readFileAsDataUrl(file),
    ]);

    sourceDataUrl = dataUrl;
    const fontFace = new FontFace(baseName, arrayBuffer);
    await fontFace.load();
    document.fonts.add(fontFace);
    loadedFontFaceValues.add(value);
  } catch (error) {
    console.error('Unable to load imported font for preview.', error);
  }

  return {
    name: baseName,
    value,
    family: `"${baseName}", sans-serif`,
    familyName: baseName,
    sourceDataUrl,
  };
}


function getManagedImageById(imageId) {
  return imageLibraryStore.getImage(imageId);
}

function assignManagedImageToSlot(slotType, slotName, imageId) {
  assignImageBorderSlot({
    imageBorderState,
    slotType,
    slotName,
    getImageById: getManagedImageById,
    imageId,
  });
}

const borderState = createBorderState({
  document,
  insideOutColorList,
  borderColorInsideOutRadio,
  borderToggle,
  imageBorderCornerButtons,
  imageBorderSideButtons,
  getImageBorderSlotState,
  getManagedImageById,
  syncLockedPaddingValues,
  drawEditorToCanvas,
  onStateChanged: () => borderTemplateFeature.markDirty(),
});

const manageImagesWindowController = createManageImagesWindowController({
  store: imageLibraryStore,
  loadImageFromFile: (file) => imageLibraryService.loadFile(file),
  elements: {
    overlay: manageImagesOverlay,
    closeButton: closeManageImagesWindowButton,
    input: manageImagesInput,
    refreshInput: manageImagesRefreshInput,
    tree: manageImagesTree,
    contextMenu: manageImagesContextMenu,
    importButton: manageImagesImportButton,
    createFolderButton: manageImagesCreateFolderButton,
    refreshButton: manageImagesRefreshButton,
    renameButton: manageImagesRenameButton,
    deleteButton: manageImagesDeleteButton,
    okButton: manageImagesOkButton,
    cancelButton: manageImagesCancelButton,
  },
  onSelectionApplied: ({ slotType, slotName }, imageId) => {
    assignManagedImageToSlot(slotType, slotName, imageId);
    borderState.updatePieceButtonLabel(slotType, slotName);
    borderTemplateFeature.markDirty();
    drawEditorToCanvas();
  },
  onStoreChanged: () => {
    borderState.updateAllPieceButtonLabels();
    persistImageLibrary();
  },
  onImagesDeleted: borderState.clearDeletedImageSlots,
});

const manageFontsWindowController = createManageFontsWindowController({
  store: fontLibraryStore,
  elements: {
    window: {
      overlay: manageFontsOverlay,
      closeButton: closeManageFontsWindowButton,
      okButton: manageFontsOkButton,
      openButton: manageFontsButton,
    },
    tree: {
      input: manageFontsInput,
      tree: manageFontsTree,
    },
    actions: {
      importButton: manageFontsImportButton,
      createFolderButton: manageFontsCreateFolderButton,
      renameButton: manageFontsRenameButton,
      deleteButton: manageFontsDeleteButton,
    },
  },
  importFontFromFile,
  onFontsChanged: () => {
    refreshFontRegistry();
    void persistFontLibraryState();
    drawEditorToCanvas();
  },
});

void initializeFontLibraryFromPersistence();

function openManageImagesWindow(slotType = null, slotName = null) {
  const initialImageId = slotType && slotName
    ? (getImageBorderSlotState(slotType, slotName)?.imageId || null)
    : null;

  manageImagesController.open(slotType, slotName, initialImageId);
}

function closeManageImagesWindow() {
  manageImagesController.close();
}

function openLoadBorderTemplateWindow() {
  borderTemplateFeature.openLoadWindow();
}

function closeLoadBorderTemplateWindow() {
  borderTemplateFeature.closeLoadWindow();
}

function openSaveBorderTemplateWindow() {
  borderTemplateFeature.openSaveWindow();
}

function closeSaveBorderTemplateWindow() {
  borderTemplateFeature.closeSaveWindow();
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

function getBorderConfig() {
  return borderController.getBorderConfig();
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

function updateCanvasBackgroundControlsState() {
  backgroundColorInput.disabled = !backgroundColorSolidRadio.checked;
  syncColorPreviewButtons();
}

function drawEditorToCanvas() {
  renderOrchestrator.render();
}

borderState.createInsideOutColorRow('#1f2937');
borderState.createInsideOutColorRow('#9ca3af');

populateColorGrid(basicColorsGrid, basicColorPalette);
populateColorGrid(customColorsGrid, customColorPalette);

const manageImagesController = createManageImagesController({
  manageImagesWindowController,
  callbacks: {
    onRenderRequested: drawEditorToCanvas,
    onStateChanged: () => borderTemplateFeature.markDirty(),
  },
});

const borderController = createBorderUiController({
  elements: {
    imageSidePaddingControls,
    imageCenterPaddingInput,
    sidePaddingControls,
    centerPaddingInput,
    borderWidthInput,
    borderRadiusInput,
    templateLoadButton: borderTemplateLoadButton,
    templateSaveAsButton: borderTemplateSaveAsButton,
    imageBorderCornerButtons,
    imageBorderSideButtons,
    imageBorderTransformInputs,
    insideOutAddColorButton,
    borderColorSolidRadio,
    borderColorInsideOutRadio,
    borderColorImagesRadio,
    backgroundColorTransparentRadio,
    backgroundColorSolidRadio,
    borderColorInput,
    imageBorderSizingModeInput,
    imageBorderRepeatModeInput,
    backgroundColorInput,
    borderBackgroundColorTransparentRadio,
    borderBackgroundColorSolidRadio,
    borderBackgroundColorInput,
    borderToggle,
    borderOptions,
    insideOutColors,
    imageBorderControls,
  },
  borderState,
  state: {
    lockState,
    imageBorderState,
  },
  actions: {
    toggleImageSideLock: (side) => {
      imageLockState[side] = !imageLockState[side];
      syncImageLockedPaddingValues();
    },
    onImageSidePaddingInput: () => {},
    onImageCenterPaddingInput: () => {
      syncImageLockedPaddingValues();
    },
    toggleSideLock: (side) => {
      lockState[side] = !lockState[side];
      syncLockedPaddingValues();
    },
    onSidePaddingInput: () => {},
    onCorePaddingInput: () => {
      syncLockedPaddingValues();
    },
    openManageImagesWindow: (slotType, slotName) => {
      openManageImagesWindow(slotType, slotName);
    },
    openLoadBorderTemplateWindow,
    openSaveBorderTemplateWindow,
    onImageBorderTransformChanged: (slotType, slotName, key, value) => {
      const slotState = getImageBorderSlotState(slotType, slotName);
      if (!slotState) {
        return;
      }

      slotState[key] = value;
    },
    onImageBorderSlotCleared: (slotType, slotName) => {
      const slotState = getImageBorderSlotState(slotType, slotName);
      clearImageBorderSlot(slotState);
      borderState.updatePieceButtonLabel(slotType, slotName);
    },
    updateCanvasBackgroundControlsState,
    syncColorPreviewButtons,
    syncColorPickerUI,
    syncLockedPaddingValues,
  },
  callbacks: {
    onRenderRequested: drawEditorToCanvas,
    onStateChanged: () => borderTemplateFeature.markDirty(),
  },
  helpers: {
    resolveRenderableImageBorderGroup,
    getManagedImageById,
    clampToPositiveNumber,
    parsePaddingNumber,
  },
});

const borderTemplateAdapterService = createBorderTemplateAdapterService({
  elements: {
    borderToggle,
    borderWidthInput,
    borderRadiusInput,
    borderColorSolidRadio,
    borderColorInsideOutRadio,
    borderColorImagesRadio,
    borderColorInput,
    borderBackgroundColorTransparentRadio,
    borderBackgroundColorSolidRadio,
    borderBackgroundColorInput,
    centerPaddingInput,
    sidePaddingControls,
    imageBorderSizingModeInput,
    imageBorderRepeatModeInput,
    imageBorderTransformInputs,
  },
  state: {
    lockState,
    imageBorderState,
  },
  borderState,
  updateBorderControlsState: borderController.updateBorderControlsState,
  syncColorPreviewButtons,
  requestRender: drawEditorToCanvas,
});

const borderTemplateFeature = createBorderTemplateFeature({
  loadBorderTemplateView,
  saveBorderTemplateView,
  getTemplatePayload: () => borderTemplateAdapterService.captureTemplateData(),
  applyTemplatePayload: (templateData) => borderTemplateAdapterService.applyTemplateData(templateData),
  onTemplateLoaded: () => {
    syncBorderTemplatePathLabel();
    drawEditorToCanvas();
  },
  onTemplateSaved: () => {
    syncBorderTemplatePathLabel();
    drawEditorToCanvas();
  },
});

function applyLeftEllipsis(element, value) {
  const fullText = value || '…';
  element.textContent = fullText;

  if (element.scrollWidth <= element.clientWidth) {
    return;
  }

  let low = 0;
  let high = fullText.length;

  while (low < high) {
    const midpoint = Math.floor((low + high) / 2);
    const candidate = `…${fullText.slice(midpoint)}`;
    element.textContent = candidate;

    if (element.scrollWidth > element.clientWidth) {
      low = midpoint + 1;
    } else {
      high = midpoint;
    }
  }

  element.textContent = `…${fullText.slice(low)}`;
}

function syncBorderTemplatePathLabel() {
  const currentPath = borderTemplateFeature.getLoadedTemplatePath();
  borderTemplatePathLabel.title = currentPath || 'No template selected';
  applyLeftEllipsis(borderTemplatePathLabel, currentPath || '…');
}

window.addEventListener('resize', syncBorderTemplatePathLabel);

const canvasPainter = createCanvasPainter({
  context,
  canvas,
  getBackgroundRectHeightForFont: createBackgroundRectHeightForFont({ context }),
  drawImageBorder: (borderConfig, borderX, borderY, borderRectWidth, borderRectHeight, drawRoundedRectPath) => drawImageBorderModule({
    context,
    borderConfig,
    borderX,
    borderY,
    borderRectWidth,
    borderRectHeight,
    drawRoundedRectPath,
  }),
});

const layoutAdapter = createLayoutAdapter({
  context,
  measureRenderedVerticalBounds: canvasPainter.measureRenderedVerticalBounds,
});

const deltaAdapter = createDeltaAdapter();

const renderOrchestrator = createRenderOrchestrator({
  quill: {
    getContents: () => quill.getContents(),
  },
  getBorderConfig,
  getCanvasBackgroundConfig,
  getCanvasSizePaddingConfig,
  painter: canvasPainter,
  canvas,
  context,
  updateEditorBackgroundColor,
  isTextWrapEnabled,
  maxImageWidthInput,
  baseCanvasContentWidth: BASE_CANVAS_CONTENT_WIDTH,
  clampToPositiveNumber,
  renderer: layoutAdapter,
  editor: deltaAdapter,
});

const colorPickerController = createColorPickerController({
  elements: {
    addCustomColorButton,
    pickScreenColorButton,
    openBackgroundColorWindowButton,
    backgroundColorWindowButton,
    borderColorWindowButton,
    borderBackgroundColorWindowButton,
    closeColorWindowButton,
    colorWindowOverlay,
    canvasPanel,
    colorMap,
    colorSlider,
    colorValueInputs,
    colorWindowOkButton,
    colorWindowCancelButton,
  },
  state: colorPickerState,
  actions: {
    handleAddCustomColor,
    pickColorFromScreen,
    openBackgroundColorWindow,
    openColorWindowForInput: (key) => {
      if (key === 'background') {
        openColorWindowForInput(backgroundColorInput, 'Image Background Color');
      }

      if (key === 'border') {
        openColorWindowForInput(borderColorInput, 'Border Color');
      }

      if (key === 'borderBackground') {
        openColorWindowForInput(borderBackgroundColorInput, 'Border Background Color');
      }
    },
    closeColorWindow,
    forwardCanvasPanelScrollToFormPanel,
    updateMapFromPointer,
    updateHueFromPointer,
    syncColorPickerUI,
    applyDraftColorFromWindow,
  },
  callbacks: {
    onRenderRequested: drawEditorToCanvas,
    onStateChanged: () => borderTemplateFeature.markDirty(),
  },
});

const settingsController = createSettingsController({
  elements: {
    settingsButton,
    closeSettingsWindowButton,
    settingsOverlay,
    darkModeToggle,
  },
  actions: {
    openSettingsWindow,
    closeSettingsWindow,
    applyDarkMode,
    persistSettings,
  },
  callbacks: {
    onRenderRequested: null,
    onStateChanged: null,
  },
});

const editorController = createEditorController({
  elements: {
    wrapTextInput,
    maxImageWidthInput,
    saveButton,
    imageNameInput,
    windowObject: window,
  },
  quill,
  actions: {
    syncEditorWrapMode,
    triggerSaveImage,
    onSave: () => {
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
    },
    closeColorWindow,
    closeSettingsWindow,
    closeManageImagesWindow,
    closeLoadBorderTemplateWindow,
    closeSaveBorderTemplateWindow,
    handleManageImagesEnter: (event) => manageImagesController.handleEnterKey(event),
    handleLoadBorderTemplateEnter: (event) => borderTemplateFeature.handleLoadEnterKey(event),
    handleSaveBorderTemplateEnter: (event) => borderTemplateFeature.handleSaveEnterKey(event),
    handleManageImagesDelete: (event) => manageImagesController.handleDeleteKey(event),
    persistSettings,
    persistImageLibrary,
  },
  callbacks: {
    onRenderRequested: drawEditorToCanvas,
    onStateChanged: () => borderTemplateFeature.markDirty(),
  },
});

manageImagesController.mount();
borderController.mount();
colorPickerController.mount();
settingsController.mount();
editorController.mount();

if (appVersionBadge) {
  appVersionBadge.textContent = APP_VERSION;
}

syncColorPickerUI();
syncColorPreviewButtons();
applySavedSettings();
borderState.updateAllPieceButtonLabels();
syncBorderTemplatePathLabel();

Promise.all([
  imageLibraryService.init(imageLibraryStore)
    .then(() => imageLibraryService.hydrateImages(imageLibraryStore)),
  borderTemplateFeature.init(),
]).then(() => {
  borderState.updateAllPieceButtonLabels();
  syncBorderTemplatePathLabel();
  drawEditorToCanvas();
});


borderController.updateBorderControlsState();
syncImageLockedPaddingValues();
updateCanvasBackgroundControlsState();
syncEditorWrapMode();
drawEditorToCanvas();
