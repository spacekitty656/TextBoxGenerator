import { createTemplateLibraryStore } from '../../border/templateLibraryStore.js';
import { createLoadBorderTemplateWindowController } from '../../ui/loadBorderTemplateWindow.js';
import { createSaveBorderTemplateWindowController } from '../../ui/saveBorderTemplateWindow.js';

export function createBorderTemplateFeature({
  loadBorderTemplateView,
  saveBorderTemplateView,
  onTemplateLoaded,
  onTemplateSaved,
}) {
  const store = createTemplateLibraryStore();

  const loadWindowController = createLoadBorderTemplateWindowController({
    store,
    elements: {
      overlay: loadBorderTemplateView.window.overlay,
      closeButton: loadBorderTemplateView.window.closeButton,
      tree: loadBorderTemplateView.tree.tree,
      contextMenu: loadBorderTemplateView.tree.contextMenu,
      createFolderButton: loadBorderTemplateView.actions.createFolderButton,
      renameButton: loadBorderTemplateView.actions.renameButton,
      deleteButton: loadBorderTemplateView.actions.deleteButton,
      loadButton: loadBorderTemplateView.window.primaryButton,
      cancelButton: loadBorderTemplateView.window.secondaryButton,
    },
    onTemplateLoaded,
  });

  const saveWindowController = createSaveBorderTemplateWindowController({
    store,
    elements: {
      overlay: saveBorderTemplateView.window.overlay,
      closeButton: saveBorderTemplateView.window.closeButton,
      tree: saveBorderTemplateView.tree.tree,
      contextMenu: saveBorderTemplateView.tree.contextMenu,
      createTemplateButton: saveBorderTemplateView.actions.createTemplateButton,
      createFolderButton: saveBorderTemplateView.actions.createFolderButton,
      renameButton: saveBorderTemplateView.actions.renameButton,
      deleteButton: saveBorderTemplateView.actions.deleteButton,
      saveButton: saveBorderTemplateView.window.primaryButton,
      cancelButton: saveBorderTemplateView.window.secondaryButton,
    },
    onTemplateSaved,
  });

  return {
    openLoadWindow: () => loadWindowController.open(),
    closeLoadWindow: () => loadWindowController.close(),
    handleLoadEnterKey: (event) => loadWindowController.handleEnterKey(event),
    openSaveWindow: () => saveWindowController.open(),
    closeSaveWindow: () => saveWindowController.close(),
    handleSaveEnterKey: (event) => saveWindowController.handleEnterKey(event),
  };
}
