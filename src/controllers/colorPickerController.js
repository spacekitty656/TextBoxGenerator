import { clampNumber, hexToRgb, rgbToHsv } from '../color.js';
import { createEventRegistry } from '../utils/events.js';

export function createColorPickerController({ elements, state, actions, callbacks }) {
  const events = createEventRegistry();
  let isMounted = false;

  function mount() {
    if (isMounted) {
      return;
    }

    const {
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
    } = elements;

    const {
      handleAddCustomColor,
      pickColorFromScreen,
      openBackgroundColorWindow,
      openColorWindowForInput,
      closeColorWindow,
      forwardCanvasPanelScrollToFormPanel,
      updateMapFromPointer,
      updateHueFromPointer,
      syncColorPickerUI,
      applyDraftColorFromWindow,
    } = actions;

    const { onRenderRequested, onStateChanged } = callbacks;

    events.on(addCustomColorButton, 'click', () => {
      handleAddCustomColor();
      onStateChanged?.();
      onRenderRequested?.();
    });

    events.on(pickScreenColorButton, 'click', async () => {
      if (!window.EyeDropper || state.isPickingFromScreen) {
        return;
      }

      pickScreenColorButton.disabled = true;
      await pickColorFromScreen();
      onStateChanged?.();
      onRenderRequested?.();
    });

    if (pickScreenColorButton && !window.EyeDropper) {
      pickScreenColorButton.disabled = true;
      pickScreenColorButton.title = 'Your browser does not support screen color picking.';
    }

    events.on(openBackgroundColorWindowButton, 'click', openBackgroundColorWindow);
    events.on(backgroundColorWindowButton, 'click', () => openColorWindowForInput('background'));
    events.on(borderColorWindowButton, 'click', () => openColorWindowForInput('border'));
    events.on(borderBackgroundColorWindowButton, 'click', () => openColorWindowForInput('borderBackground'));
    events.on(closeColorWindowButton, 'click', closeColorWindow);

    events.on(colorWindowOverlay, 'click', (event) => {
      if (event.target === colorWindowOverlay) {
        closeColorWindow();
      }
    });

    events.on(canvasPanel, 'wheel', forwardCanvasPanelScrollToFormPanel, { passive: false });

    events.on(colorMap, 'pointerdown', (event) => {
      state.dragTarget = 'map';
      colorMap.setPointerCapture(event.pointerId);
      updateMapFromPointer(event);
    });

    events.on(colorMap, 'pointermove', (event) => {
      if (state.dragTarget === 'map') {
        updateMapFromPointer(event);
      }
    });

    events.on(colorMap, 'pointerup', (event) => {
      state.dragTarget = null;
      colorMap.releasePointerCapture(event.pointerId);
    });

    events.on(colorSlider, 'pointerdown', (event) => {
      state.dragTarget = 'slider';
      colorSlider.setPointerCapture(event.pointerId);
      updateHueFromPointer(event);
    });

    events.on(colorSlider, 'pointermove', (event) => {
      if (state.dragTarget === 'slider') {
        updateHueFromPointer(event);
      }
    });

    events.on(colorSlider, 'pointerup', (event) => {
      state.dragTarget = null;
      colorSlider.releasePointerCapture(event.pointerId);
    });

    events.on(colorValueInputs.hue, 'input', () => {
      state.hue = clampNumber(colorValueInputs.hue.value, 0, 360, state.hue);
      syncColorPickerUI();
    });

    events.on(colorValueInputs.sat, 'input', () => {
      state.sat = clampNumber(colorValueInputs.sat.value, 0, 255, state.sat);
      syncColorPickerUI();
    });

    events.on(colorValueInputs.val, 'input', () => {
      state.val = clampNumber(colorValueInputs.val.value, 0, 255, state.val);
      syncColorPickerUI();
    });

    ['red', 'green', 'blue', 'alpha'].forEach((key) => {
      events.on(colorValueInputs[key], 'input', () => {
        const red = clampNumber(colorValueInputs.red.value, 0, 255, 0);
        const green = clampNumber(colorValueInputs.green.value, 0, 255, 0);
        const blue = clampNumber(colorValueInputs.blue.value, 0, 255, 0);
        const hsv = rgbToHsv(red, green, blue);
        state.hue = hsv.hue;
        state.sat = hsv.sat;
        state.val = hsv.val;
        state.alpha = clampNumber(colorValueInputs.alpha.value, 0, 255, state.alpha);
        syncColorPickerUI();
      });
    });

    events.on(colorValueInputs.hex, 'change', () => {
      const rgb = hexToRgb(colorValueInputs.hex.value);
      if (!rgb) {
        syncColorPickerUI();
        return;
      }

      const hsv = rgbToHsv(rgb.red, rgb.green, rgb.blue);
      state.hue = hsv.hue;
      state.sat = hsv.sat;
      state.val = hsv.val;
      state.alpha = rgb.alpha ?? 255;
      syncColorPickerUI();
    });

    events.on(colorWindowOkButton, 'click', () => {
      applyDraftColorFromWindow();
      onStateChanged?.();
      onRenderRequested?.();
    });

    events.on(colorWindowCancelButton, 'click', closeColorWindow);

    isMounted = true;
  }

  function unmount() {
    if (!isMounted) {
      return;
    }

    events.clear();
    isMounted = false;
  }

  return {
    mount,
    unmount,
  };
}
