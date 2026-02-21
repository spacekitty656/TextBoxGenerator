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
import { createBackgroundRectHeightForFont, createLayoutAdapter } from './render/layoutAdapter.js';
import { createRenderOrchestrator } from './render/renderOrchestrator.js';
import { createBorderControlsView } from './ui/views/borderControlsView.js';
import { createColorPickerView } from './ui/views/colorPickerView.js';
import { createEditorView } from './ui/views/editorView.js';
import { createManageImagesView } from './ui/views/manageImagesView.js';
import { createLoadBorderTemplateView } from './ui/views/loadBorderTemplateView.js';
import { createSaveBorderTemplateView } from './ui/views/saveBorderTemplateView.js';
import { createSettingsView } from './ui/views/settingsView.js';
import { createColorPickerController } from './controllers/colorPickerController.js';
import { createEditorController } from './controllers/editorController.js';
import { createManageImagesController } from './controllers/manageImagesController.js';
import { createSettingsController } from './controllers/settingsController.js';
import { createBorderState } from './features/border/borderState.js';
import { createBorderUiController } from './features/border/borderUiController.js';
import { createBorderTemplateFeature } from './features/border/borderTemplateFeature.js';

const Quill = window.Quill;

const editorView = createEditorView(document);
const settingsView = createSettingsView(document);
const borderControlsView = createBorderControlsView(document);
const manageImagesView = createManageImagesView(document);
const loadBorderTemplateView = createLoadBorderTemplateView(document);
const saveBorderTemplateView = createSaveBorderTemplateView(document);
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

const FONT_WHITELIST = ['sansserif', 'serif', 'monospace', 'pressstart2p'];

const QuillFont = Quill.import('formats/font');
QuillFont.whitelist = FONT_WHITELIST;
Quill.register(QuillFont, true);

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





function getImageBorderSlotState(slotType, slotName) {
  return getImageBorderSlotStateModule(imageBorderState, slotType, slotName);
}

const imageLibraryStore = createImageLibraryStore();
const imageLibraryService = createImageLibraryService({
  setStorageStatusMessage,
});


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
    drawEditorToCanvas();
  },
  onStoreChanged: () => {
    borderState.updateAllPieceButtonLabels();
    persistImageLibrary();
  },
  onImagesDeleted: borderState.clearDeletedImageSlots,
});

const borderTemplateFeature = createBorderTemplateFeature({
  loadBorderTemplateView,
  saveBorderTemplateView,
  getTemplatePayload: () => getBorderConfig(),
  onTemplateLoaded: () => {
    drawEditorToCanvas();
  },
  onTemplateSaved: () => {
    drawEditorToCanvas();
  },
});

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
    onStateChanged: null,
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
    onStateChanged: null,
  },
  helpers: {
    resolveRenderableImageBorderGroup,
    getManagedImageById,
    clampToPositiveNumber,
    parsePaddingNumber,
  },
});

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
    onStateChanged: null,
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
    onStateChanged: null,
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

Promise.all([
  imageLibraryService.init(imageLibraryStore)
    .then(() => imageLibraryService.hydrateImages(imageLibraryStore)),
  borderTemplateFeature.init(),
]).then(() => {
  borderState.updateAllPieceButtonLabels();
  drawEditorToCanvas();
});


borderController.updateBorderControlsState();
syncImageLockedPaddingValues();
updateCanvasBackgroundControlsState();
syncEditorWrapMode();
drawEditorToCanvas();
