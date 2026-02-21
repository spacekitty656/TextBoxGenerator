export function createBorderState({
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
  onStateChanged,
}) {
  const insideOutColorInputs = [];

  function notifyStateChanged() {
    onStateChanged?.();
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
    const isBrokenReference = Boolean(slotState?.imageId && !imageEntry);
    const sourceName = imageEntry?.name || '';

    button.textContent = isBrokenReference ? '⚠ Missing image' : toCompactPieceLabel(sourceName);
    button.title = isBrokenReference
      ? 'Missing image reference. Reassign this piece.'
      : (sourceName || 'Select image');
    button.classList.toggle('piece-select-button-broken', isBrokenReference);
  }

  function updateAllPieceButtonLabels() {
    Object.keys(imageBorderCornerButtons).forEach((slotName) => {
      updatePieceButtonLabel('corners', slotName);
    });

    Object.keys(imageBorderSideButtons).forEach((slotName) => {
      updatePieceButtonLabel('sides', slotName);
    });
  }

  function clearDeletedImageSlots() {
    updateAllPieceButtonLabels();
    notifyStateChanged();
    drawEditorToCanvas();
  }

  function registerInsideOutColorInput(input) {
    input.addEventListener('input', () => {
      syncLockedPaddingValues();
      notifyStateChanged();
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
      notifyStateChanged();
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
      notifyStateChanged();
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
      notifyStateChanged();
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
    notifyStateChanged();
    drawEditorToCanvas();
  }

  function getInsideOutColorValues() {
    return insideOutColorInputs.map((input) => input.value);
  }

  return {
    getPieceButton,
    toCompactPieceLabel,
    updatePieceButtonLabel,
    updateAllPieceButtonLabels,
    clearDeletedImageSlots,
    updateInsideOutColorRowsState,
    createInsideOutColorRow,
    addInsideOutColor,
    getInsideOutColorValues,
  };
}
