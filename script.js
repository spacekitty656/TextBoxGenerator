const canvas = document.getElementById('preview-canvas');
const context = canvas.getContext('2d');
const editorElement = document.getElementById('editor');
const saveButton = document.getElementById('save-image');
const imageNameInput = document.getElementById('image-name');
const appVersionBadge = document.getElementById('app-version');
const APP_VERSION = 'v1.1.3';
const BASE_CANVAS_CONTENT_WIDTH = 900;

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
const testWindowButton = document.getElementById('open-color-window');
const colorWindowOverlay = document.getElementById('color-window-overlay');
const closeColorWindowButton = document.getElementById('close-color-window');
const basicColorsGrid = document.querySelector('.basic-colors-grid');
const customColorsGrid = document.querySelector('.custom-colors-grid');

const basicColorPalette = [
  '#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
  '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
  '#400000', '#804000', '#408000', '#004000', '#004040', '#000040', '#400040', '#404040',
  '#ff8080', '#ffc080', '#ffff80', '#80ff80', '#80ffff', '#8080ff', '#ff80ff', '#d0d0d0',
  '#8000ff', '#ff0080', '#ff8000', '#80ff00', '#00ff80', '#0080ff', '#8000ff', '#ffe680',
  '#660033', '#cc3300', '#cc6600', '#66cc00', '#00cc66', '#0066cc', '#3300cc', '#66ffff',
];

function applyColorFromSwatch(color) {
  if (!color) {
    return;
  }

  quill.focus();
  quill.format('color', color, 'user');
  closeColorWindow();
  drawEditorToCanvas();
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
    swatch.style.background = color;
    swatch.setAttribute('aria-label', `Use text color ${color}`);
    swatch.addEventListener('click', () => {
      applyColorFromSwatch(color);
    });
    gridElement.appendChild(swatch);
  });
}

function openColorWindow() {
  if (!colorWindowOverlay) {
    return;
  }

  colorWindowOverlay.classList.remove('hidden');
  colorWindowOverlay.setAttribute('aria-hidden', 'false');
}

function closeColorWindow() {
  if (!colorWindowOverlay) {
    return;
  }

  colorWindowOverlay.classList.add('hidden');
  colorWindowOverlay.setAttribute('aria-hidden', 'true');
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

const DEFAULT_STYLE = {
  bold: false,
  italic: false,
  underline: false,
  color: '#111827',
  font: 'sansserif',
  size: 'normal',
};

const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: {
      container: '#editor-toolbar',
    },
  },
  placeholder: 'Type formatted text here...',
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
  editorElement.classList.toggle('editor-no-wrap', !isTextWrapEnabled());
}

function clampToPositiveNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
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
  const group = imageBorderState[slotType];
  return group ? group[slotName] : null;
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
  const centerValue = clampToPositiveNumber(centerInput.value, fallback);

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
  const enabled = borderToggle.checked;
  const width = clampToPositiveNumber(borderWidthInput.value, 2);
  const radius = clampToPositiveNumber(borderRadiusInput.value, 16);
  const colorMode = resolveBorderColorMode();
  const color = borderColorInput.value;
  const insideOutColors = insideOutColorInputs.map((input) => input.value);
  const backgroundMode = borderBackgroundColorSolidRadio.checked ? 'solid' : 'transparent';
  const backgroundColor = borderBackgroundColorInput.value;
  const centerPadding = clampToPositiveNumber(centerPaddingInput.value, 24);

  const padding = {
    top: lockState.top ? centerPadding : clampToPositiveNumber(sidePaddingControls.top.input.value, centerPadding),
    right: lockState.right
      ? centerPadding
      : clampToPositiveNumber(sidePaddingControls.right.input.value, centerPadding),
    bottom: lockState.bottom
      ? centerPadding
      : clampToPositiveNumber(sidePaddingControls.bottom.input.value, centerPadding),
    left: lockState.left ? centerPadding : clampToPositiveNumber(sidePaddingControls.left.input.value, centerPadding),
  };

  return {
    enabled,
    width,
    radius,
    colorMode,
    color,
    insideOutColors,
    imageBorder: {
      corners: imageBorderState.corners,
      sides: imageBorderState.sides,
      sizingStrategy: imageBorderSizingModeInput?.value || 'auto',
      sideMode: imageBorderRepeatModeInput?.value || 'stretch',
    },
    backgroundMode,
    backgroundColor,
    padding,
  };
}

function getCanvasBackgroundConfig() {
  const mode = backgroundColorSolidRadio.checked ? 'solid' : 'transparent';

  return {
    mode,
    color: backgroundColorInput.value,
  };
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

function getCanvasSizePaddingConfig() {
  const centerPadding = clampToPositiveNumber(imageCenterPaddingInput.value, 50);

  return {
    top: imageLockState.top
      ? centerPadding
      : clampToPositiveNumber(imageSidePaddingControls.top.input.value, centerPadding),
    right: imageLockState.right
      ? centerPadding
      : clampToPositiveNumber(imageSidePaddingControls.right.input.value, centerPadding),
    bottom: imageLockState.bottom
      ? centerPadding
      : clampToPositiveNumber(imageSidePaddingControls.bottom.input.value, centerPadding),
    left: imageLockState.left
      ? centerPadding
      : clampToPositiveNumber(imageSidePaddingControls.left.input.value, centerPadding),
  };
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
    fontSize,
    fontFamily,
  };
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

function tokenizeText(text) {
  const parts = text.match(/\S+|\s+/g);
  return parts || [''];
}

function extractDocumentFromDelta(delta) {
  const lines = [];
  let currentRuns = [];

  delta.ops.forEach((op) => {
    if (typeof op.insert !== 'string') {
      return;
    }

    const chunks = op.insert.split('\n');

    chunks.forEach((chunk, index) => {
      if (chunk.length > 0) {
        currentRuns.push({
          text: chunk,
          attributes: op.attributes || {},
        });
      }

      if (index < chunks.length - 1) {
        lines.push({
          runs: currentRuns,
          align: op.attributes?.align || 'left',
        });
        currentRuns = [];
      }
    });
  });

  if (currentRuns.length > 0) {
    lines.push({ runs: currentRuns, align: 'left' });
  }

  if (lines.length === 0) {
    lines.push({ runs: [{ text: '', attributes: {} }], align: 'left' });
  }

  return lines;
}

function layoutDocumentForCanvas(lines, maxWidth, wrapEnabled) {
  const laidOutLines = [];

  lines.forEach((line) => {
    let currentTokens = [];
    let currentWidth = 0;
    let maxFontSizeInLine = SIZE_MAP.normal;

    const pushCurrentLine = () => {
      if (currentTokens.length === 0) {
        return;
      }

      laidOutLines.push({
        align: line.align || 'left',
        tokens: [...currentTokens],
        width: currentWidth,
        lineHeight: Math.round(maxFontSizeInLine * 1.35),
      });

      currentTokens = [];
      currentWidth = 0;
      maxFontSizeInLine = SIZE_MAP.normal;
    };

    line.runs.forEach((run) => {
      const style = getCanvasStyle(run.attributes);
      const font = buildCanvasFont(style);
      const tokens = tokenizeText(run.text);

      tokens.forEach((tokenText) => {
        context.font = font;
        const tokenWidth = context.measureText(tokenText).width;

        if (wrapEnabled && currentWidth + tokenWidth > maxWidth && currentTokens.length > 0 && tokenText.trim()) {
          pushCurrentLine();
        }

        currentTokens.push({
          text: tokenText,
          style,
          font,
          width: tokenWidth,
        });

        currentWidth += tokenWidth;
        maxFontSizeInLine = Math.max(maxFontSizeInLine, style.fontSize);
      });
    });

    pushCurrentLine();

    if (line.runs.length === 0) {
      laidOutLines.push({
        align: line.align || 'left',
        tokens: [],
        width: 0,
        lineHeight: Math.round(SIZE_MAP.normal * 1.35),
      });
    }
  });

  return laidOutLines;
}

function getAlignedStartX(align, startX, maxWidth, lineWidth) {
  if (align === 'center') {
    return startX + (maxWidth - lineWidth) / 2;
  }

  if (align === 'right') {
    return startX + (maxWidth - lineWidth);
  }

  return startX;
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
  if (!hasReadyImage(slot) || width <= 0 || height <= 0) {
    return false;
  }

  const sourceImage = slot.image;

  if (sideMode === 'repeat') {
    const sourceSize = getSlotImageSize(slot);
    const tileLength = orientation === 'horizontal'
      ? Math.max(1, sourceSize.width || sourceSize.height || width)
      : Math.max(1, sourceSize.height || sourceSize.width || height);

    if (orientation === 'horizontal') {
      let drawX = x;
      const maxX = x + width;
      while (drawX < maxX) {
        const drawWidth = Math.min(tileLength, maxX - drawX);
        context.drawImage(sourceImage, drawX, y, drawWidth, height);
        drawX += tileLength;
      }
    } else {
      let drawY = y;
      const maxY = y + height;
      while (drawY < maxY) {
        const drawHeight = Math.min(tileLength, maxY - drawY);
        context.drawImage(sourceImage, x, drawY, width, drawHeight);
        drawY += tileLength;
      }
    }

    return true;
  }

  context.drawImage(sourceImage, x, y, width, height);
  return true;
}

function drawImageBorder(borderConfig, borderX, borderY, borderRectWidth, borderRectHeight) {
  const fallbackColor = borderConfig.color;
  const { sizingStrategy, sideMode, corners, sides } = borderConfig.imageBorder;

  context.save();
  drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
  context.clip();

  const defaultCornerSize = Math.max(1, borderConfig.width);
  const topLeftCorner = corners?.topLeft;
  const topRightCorner = corners?.topRight;
  const bottomRightCorner = corners?.bottomRight;
  const bottomLeftCorner = corners?.bottomLeft;

  const topLeftSize = getSlotImageSize(topLeftCorner);
  const topRightSize = getSlotImageSize(topRightCorner);
  const bottomRightSize = getSlotImageSize(bottomRightCorner);
  const bottomLeftSize = getSlotImageSize(bottomLeftCorner);

  const resolveCornerDrawSize = (slot, slotSize) => {
    if (!hasReadyImage(slot)) {
      return { width: defaultCornerSize, height: defaultCornerSize };
    }

    if (sizingStrategy === 'fixed') {
      return { width: defaultCornerSize, height: defaultCornerSize };
    }

    const targetHeight = Math.max(1, borderConfig.width);
    const safeSourceHeight = Math.max(1, slotSize.height || targetHeight);
    const scaledWidth = Math.max(1, Math.round((slotSize.width || targetHeight) * (targetHeight / safeSourceHeight)));
    return {
      width: scaledWidth,
      height: targetHeight,
    };
  };

  const topLeftDrawSize = resolveCornerDrawSize(topLeftCorner, topLeftSize);
  const topRightDrawSize = resolveCornerDrawSize(topRightCorner, topRightSize);
  const bottomRightDrawSize = resolveCornerDrawSize(bottomRightCorner, bottomRightSize);
  const bottomLeftDrawSize = resolveCornerDrawSize(bottomLeftCorner, bottomLeftSize);

  const topLeftWidth = topLeftDrawSize.width;
  const topLeftHeight = topLeftDrawSize.height;
  const topRightWidth = topRightDrawSize.width;
  const topRightHeight = topRightDrawSize.height;
  const bottomRightWidth = bottomRightDrawSize.width;
  const bottomRightHeight = bottomRightDrawSize.height;
  const bottomLeftWidth = bottomLeftDrawSize.width;
  const bottomLeftHeight = bottomLeftDrawSize.height;

  if (hasReadyImage(topLeftCorner)) {
    context.drawImage(topLeftCorner.image, borderX, borderY, topLeftWidth, topLeftHeight);
  }

  if (hasReadyImage(topRightCorner)) {
    context.drawImage(topRightCorner.image, borderX + borderRectWidth - topRightWidth, borderY, topRightWidth, topRightHeight);
  }

  if (hasReadyImage(bottomRightCorner)) {
    context.drawImage(
      bottomRightCorner.image,
      borderX + borderRectWidth - bottomRightWidth,
      borderY + borderRectHeight - bottomRightHeight,
      bottomRightWidth,
      bottomRightHeight,
    );
  }

  if (hasReadyImage(bottomLeftCorner)) {
    context.drawImage(bottomLeftCorner.image, borderX, borderY + borderRectHeight - bottomLeftHeight, bottomLeftWidth, bottomLeftHeight);
  }

  const topSideX = borderX + topLeftWidth;
  const topSideWidth = Math.max(0, borderRectWidth - topLeftWidth - topRightWidth);
  const topSideHeight = Math.max(1, Math.max(topLeftHeight, topRightHeight, borderConfig.width));

  const bottomSideX = borderX + bottomLeftWidth;
  const bottomSideWidth = Math.max(0, borderRectWidth - bottomLeftWidth - bottomRightWidth);
  const bottomSideHeight = Math.max(1, Math.max(bottomLeftHeight, bottomRightHeight, borderConfig.width));

  const leftSideY = borderY + topLeftHeight;
  const leftSideHeight = Math.max(0, borderRectHeight - topLeftHeight - bottomLeftHeight);
  const leftSideWidth = Math.max(1, Math.max(topLeftWidth, bottomLeftWidth, borderConfig.width));

  const rightSideY = borderY + topRightHeight;
  const rightSideHeight = Math.max(0, borderRectHeight - topRightHeight - bottomRightHeight);
  const rightSideWidth = Math.max(1, Math.max(topRightWidth, bottomRightWidth, borderConfig.width));

  drawSideImage(sides?.top, topSideX, borderY, topSideWidth, topSideHeight, 'horizontal', sideMode);
  drawSideImage(
    sides?.bottom,
    bottomSideX,
    borderY + borderRectHeight - bottomSideHeight,
    bottomSideWidth,
    bottomSideHeight,
    'horizontal',
    sideMode,
  );
  drawSideImage(sides?.left, borderX, leftSideY, leftSideWidth, leftSideHeight, 'vertical', sideMode);
  drawSideImage(
    sides?.right,
    borderX + borderRectWidth - rightSideWidth,
    rightSideY,
    rightSideWidth,
    rightSideHeight,
    'vertical',
    sideMode,
  );

  context.restore();

  const hasAnyImage = [
    corners?.topLeft,
    corners?.topRight,
    corners?.bottomRight,
    corners?.bottomLeft,
    sides?.top,
    sides?.right,
    sides?.bottom,
    sides?.left,
  ].some(hasReadyImage);

  if (!hasAnyImage) {
    context.save();
    context.lineWidth = borderConfig.width;
    context.strokeStyle = fallbackColor;
    drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
    context.stroke();
    context.restore();
  }
}

function calculateCanvasDimensions(laidOutLines, borderConfig, canvasSizePaddingConfig, maxContentWidth) {
  const borderWidth = borderConfig.enabled ? borderConfig.width : 0;
  const textPadding = borderConfig.enabled
    ? borderConfig.padding
    : { top: 0, right: 0, bottom: 0, left: 0 };
  const textStartX = canvasSizePaddingConfig.left + borderWidth + textPadding.left;
  const textStartY = canvasSizePaddingConfig.top + borderWidth + textPadding.top;
  const lineStartPositions = laidOutLines.map((line) => getAlignedStartX(line.align, textStartX, maxContentWidth, line.width));
  const renderedMinX = lineStartPositions.length ? Math.min(...lineStartPositions) : textStartX;
  const renderedMaxX = laidOutLines.reduce((maxX, line, index) => Math.max(maxX, lineStartPositions[index] + line.width), renderedMinX);
  const verticalBounds = measureRenderedVerticalBounds(laidOutLines, textStartY);

  if (borderConfig.enabled) {
    const borderX = renderedMinX - textPadding.left - borderWidth / 2;
    const borderY = verticalBounds.minY - textPadding.top - borderWidth / 2;
    const borderRectWidth = renderedMaxX - renderedMinX + textPadding.left + textPadding.right + borderWidth;
    const borderRectHeight = verticalBounds.maxY - verticalBounds.minY + textPadding.top + textPadding.bottom + borderWidth;

    return {
      width: Math.max(1, Math.ceil(borderX + borderRectWidth + canvasSizePaddingConfig.right)),
      height: Math.max(1, Math.ceil(borderY + borderRectHeight + canvasSizePaddingConfig.bottom)),
    };
  }

  return {
    width: Math.max(1, Math.ceil(renderedMaxX + canvasSizePaddingConfig.right)),
    height: Math.max(1, Math.ceil(verticalBounds.maxY + canvasSizePaddingConfig.bottom)),
  };
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

  const lineStartPositions = laidOutLines.map((line) => getAlignedStartX(line.align, textStartX, maxContentWidth, line.width));
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

  let y = textStartY;
  laidOutLines.forEach((line, index) => {
    const startX = lineStartPositions[index];
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
}

function drawEditorToCanvas() {
  const borderConfig = getBorderConfig();
  const canvasBackgroundConfig = getCanvasBackgroundConfig();
  updateEditorBackgroundColor(borderConfig, canvasBackgroundConfig);
  const canvasSizePaddingConfig = getCanvasSizePaddingConfig();
  const maxContentWidth = Math.max(
    50,
    BASE_CANVAS_CONTENT_WIDTH
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
  drawEditorToCanvas();
});

[imageBorderSizingModeInput, imageBorderRepeatModeInput].forEach((input) => {
  input?.addEventListener('change', () => {
    drawEditorToCanvas();
  });
});

backgroundColorInput.addEventListener('input', () => {
  drawEditorToCanvas();
});

[borderBackgroundColorTransparentRadio, borderBackgroundColorSolidRadio].forEach((radioInput) => {
  radioInput.addEventListener('change', () => {
    updateBorderColorModeUI();
    drawEditorToCanvas();
  });
});

borderBackgroundColorInput.addEventListener('input', () => {
  drawEditorToCanvas();
});

borderToggle.addEventListener('change', () => {
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
populateColorGrid(customColorsGrid, Array.from({ length: 16 }, () => '#f3f4f6'));

if (testWindowButton) {
  testWindowButton.addEventListener('click', openColorWindow);
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

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeColorWindow();
  }
});

if (appVersionBadge) {
  appVersionBadge.textContent = APP_VERSION;
}

updateBorderControlsState();
syncImageLockedPaddingValues();
updateCanvasBackgroundControlsState();
syncEditorWrapMode();
drawEditorToCanvas();
