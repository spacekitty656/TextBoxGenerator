import { createEventRegistry } from '../utils/events.js';

export function createBorderController({ elements, actions, callbacks }) {
  const events = createEventRegistry();
  let isMounted = false;

  function mount() {
    if (isMounted) {
      return;
    }

    const {
      imageSidePaddingControls,
      imageCenterPaddingInput,
      sidePaddingControls,
      centerPaddingInput,
      borderWidthInput,
      borderRadiusInput,
      templateLoadButton,
      templateSaveAsButton,
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
    } = elements;

    const {
      toggleImageSideLock,
      onImageSidePaddingInput,
      onImageCenterPaddingInput,
      toggleSideLock,
      onSidePaddingInput,
      onCorePaddingInput,
      openManageImagesWindow,
      openLoadBorderTemplateWindow,
      openSaveBorderTemplateWindow,
      onImageBorderTransformChanged,
      onImageBorderSlotCleared,
      addInsideOutColor,
      updateBorderColorModeUI,
      updateCanvasBackgroundControlsState,
      syncColorPreviewButtons,
      updateBorderControlsState,
      syncColorPickerUI,
    } = actions;

    const { onRenderRequested, onStateChanged } = callbacks;

    Object.entries(imageSidePaddingControls).forEach(([side, { lock, input }]) => {
      events.on(lock, 'click', () => {
        toggleImageSideLock(side);
        onStateChanged?.();
        onRenderRequested?.();
      });

      events.on(input, 'input', () => {
        onImageSidePaddingInput();
        onRenderRequested?.();
      });
    });

    events.on(imageCenterPaddingInput, 'input', () => {
      onImageCenterPaddingInput();
      onRenderRequested?.();
    });

    Object.entries(sidePaddingControls).forEach(([side, { lock, input }]) => {
      events.on(lock, 'click', () => {
        toggleSideLock(side);
        onStateChanged?.();
        onRenderRequested?.();
      });

      events.on(input, 'input', () => {
        onSidePaddingInput();
        onRenderRequested?.();
      });
    });

    [centerPaddingInput, borderWidthInput, borderRadiusInput].forEach((input) => {
      events.on(input, 'input', () => {
        onCorePaddingInput();
        onRenderRequested?.();
      });
    });

    events.on(templateLoadButton, 'click', () => {
      openLoadBorderTemplateWindow();
    });

    events.on(templateSaveAsButton, 'click', () => {
      openSaveBorderTemplateWindow();
    });

    Object.entries(imageBorderCornerButtons).forEach(([corner, button]) => {
      events.on(button, 'click', () => {
        openManageImagesWindow('corners', corner);
      });
    });

    Object.entries(imageBorderSideButtons).forEach(([side, button]) => {
      events.on(button, 'click', () => {
        openManageImagesWindow('sides', side);
      });
    });

    Object.entries(imageBorderTransformInputs).forEach(([slotType, group]) => {
      Object.entries(group).forEach(([slotName, controls]) => {
        events.on(controls.rotation, 'change', () => {
          onImageBorderTransformChanged(slotType, slotName, 'rotation', Number.parseInt(controls.rotation.value, 10) || 0);
          onRenderRequested?.();
        });

        events.on(controls.flipX, 'change', () => {
          onImageBorderTransformChanged(slotType, slotName, 'flipX', controls.flipX.checked);
          onRenderRequested?.();
        });

        events.on(controls.flipY, 'change', () => {
          onImageBorderTransformChanged(slotType, slotName, 'flipY', controls.flipY.checked);
          onRenderRequested?.();
        });

        events.on(controls.clear, 'click', () => {
          onImageBorderSlotCleared(slotType, slotName);
          onStateChanged?.();
          onRenderRequested?.();
        });
      });
    });

    events.on(insideOutAddColorButton, 'click', () => {
      addInsideOutColor();
      onStateChanged?.();
      onRenderRequested?.();
    });

    [borderColorSolidRadio, borderColorInsideOutRadio, borderColorImagesRadio].forEach((radioInput) => {
      events.on(radioInput, 'change', () => {
        updateBorderColorModeUI();
        onRenderRequested?.();
      });
    });

    [backgroundColorTransparentRadio, backgroundColorSolidRadio].forEach((radioInput) => {
      events.on(radioInput, 'change', () => {
        updateCanvasBackgroundControlsState();
        onRenderRequested?.();
      });
    });

    events.on(borderColorInput, 'input', () => {
      syncColorPreviewButtons();
      onRenderRequested?.();
    });

    [imageBorderSizingModeInput, imageBorderRepeatModeInput].forEach((input) => {
      events.on(input, 'change', () => {
        onRenderRequested?.();
      });
    });

    events.on(backgroundColorInput, 'input', () => {
      syncColorPreviewButtons();
      onRenderRequested?.();
    });

    [borderBackgroundColorTransparentRadio, borderBackgroundColorSolidRadio].forEach((radioInput) => {
      events.on(radioInput, 'change', () => {
        updateBorderColorModeUI();
        onRenderRequested?.();
      });
    });

    events.on(borderBackgroundColorInput, 'input', () => {
      syncColorPreviewButtons();
      onRenderRequested?.();
    });

    events.on(borderToggle, 'change', () => {
      syncColorPickerUI();
      syncColorPreviewButtons();
      updateBorderControlsState();
      onRenderRequested?.();
    });

    isMounted = true;
  }

  function unmount() {
    if (!isMounted) {
      return;
    }

    events.clear();
    isMounted = false;
  }

  return { mount, unmount };
}
