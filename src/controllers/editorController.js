import { createEventRegistry } from '../utils/events.js';

export function createEditorController({ elements, quill, actions, callbacks }) {
  const events = createEventRegistry();
  let isMounted = false;
  let textChangeHandler = null;

  function mount() {
    if (isMounted) {
      return;
    }

    const { wrapTextInput, maxImageWidthInput, saveButton, imageNameInput, windowObject } = elements;
    const {
      syncEditorWrapMode,
      triggerSaveImage,
      onSave,
      closeColorWindow,
      closeSettingsWindow,
      closeManageImagesWindow,
      closeLoadBorderTemplateWindow,
      closeSaveBorderTemplateWindow,
      handleManageImagesEnter,
      handleLoadBorderTemplateEnter,
      handleSaveBorderTemplateEnter,
      handleManageImagesDelete,
      persistSettings,
      persistImageLibrary,
    } = actions;
    const { onRenderRequested, onStateChanged } = callbacks;

    textChangeHandler = () => {
      onRenderRequested?.();
    };
    quill.on('text-change', textChangeHandler);

    events.on(wrapTextInput, 'change', () => {
      syncEditorWrapMode();
      onStateChanged?.();
      onRenderRequested?.();
    });

    events.on(maxImageWidthInput, 'input', () => {
      onRenderRequested?.();
    });

    events.on(saveButton, 'click', () => {
      onSave();
    });

    events.on(imageNameInput, 'keydown', (event) => {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      triggerSaveImage();
    });

    events.on(windowObject, 'keydown', (event) => {
      if (event.key === 'Escape') {
        closeColorWindow();
        closeSettingsWindow();
        closeManageImagesWindow();
        closeLoadBorderTemplateWindow();
        closeSaveBorderTemplateWindow();
      }

      if (event.key === 'Enter' && (
        handleManageImagesEnter(event)
        || handleLoadBorderTemplateEnter(event)
        || handleSaveBorderTemplateEnter(event)
      )) {
        event.preventDefault();
      }

      if (event.key === 'Delete' && handleManageImagesDelete(event)) {
        event.preventDefault();
      }
    });

    events.on(windowObject, 'beforeunload', () => {
      persistSettings();
      persistImageLibrary();
    });

    isMounted = true;
  }

  function unmount() {
    if (!isMounted) {
      return;
    }

    events.clear();
    if (textChangeHandler) {
      quill.off('text-change', textChangeHandler);
      textChangeHandler = null;
    }

    isMounted = false;
  }

  return { mount, unmount };
}
