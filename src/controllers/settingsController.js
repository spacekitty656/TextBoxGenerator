import { createEventRegistry } from '../utils/events.js';

export function createSettingsController({
  elements,
  actions,
  callbacks,
}) {
  const events = createEventRegistry();
  let isMounted = false;

  function mount() {
    if (isMounted) {
      return;
    }

    const { settingsButton, closeSettingsWindowButton, settingsOverlay, darkModeToggle } = elements;
    const { openSettingsWindow, closeSettingsWindow, applyDarkMode, persistSettings } = actions;
    const { onRenderRequested, onStateChanged } = callbacks;

    events.on(settingsButton, 'click', openSettingsWindow);
    events.on(closeSettingsWindowButton, 'click', closeSettingsWindow);
    events.on(settingsOverlay, 'click', (event) => {
      if (event.target === settingsOverlay) {
        closeSettingsWindow();
      }
    });

    events.on(darkModeToggle, 'change', () => {
      applyDarkMode(darkModeToggle.checked);
      persistSettings();
      onStateChanged?.();
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

  return {
    mount,
    unmount,
  };
}
