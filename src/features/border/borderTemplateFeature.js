import {
  createTemplateLibraryStore,
  DEFAULT_BORDER_TEMPLATE_ID,
} from '../../border/templateLibraryStore.js';
import { createLoadBorderTemplateWindowController } from '../../ui/loadBorderTemplateWindow.js';
import { createSaveBorderTemplateWindowController } from '../../ui/saveBorderTemplateWindow.js';
import {
  persistTemplateLibraryToIndexedDb,
  restoreTemplateLibraryFromIndexedDb,
} from '../../templates/templatePersistenceIndexedDb.js';
import {
  persistSelectedTemplateIdentifier,
  readSelectedTemplateIdentifier,
} from '../../templates/templateSelectionStorage.js';

const BORDER_TEMPLATE_CLASS = 'border';

export function createBorderTemplateFeature({
  loadBorderTemplateView,
  saveBorderTemplateView,
  getTemplatePayload = () => null,
  applyTemplatePayload,
  onTemplateLoaded,
  onTemplateSaved,
}) {
  const store = createTemplateLibraryStore();
  const state = {
    loadedTemplateId: DEFAULT_BORDER_TEMPLATE_ID,
    isDirty: false,
  };

  async function persistLibrary() {
    const result = await persistTemplateLibraryToIndexedDb(store);
    if (!result?.ok && result?.error) {
      console.warn('Unable to persist border template library.', result.error);
    }

    return result;
  }

  function persistSelection(templateId) {
    persistSelectedTemplateIdentifier(templateId);
  }

  function isValidBorderTemplate(template) {
    return template?.type === 'template' && template.templateClass === BORDER_TEMPLATE_CLASS;
  }

  function markDirty() {
    state.isDirty = true;
  }

  function resetDirty() {
    state.isDirty = false;
  }

  function getLoadedTemplate() {
    return store.getTemplate(state.loadedTemplateId);
  }


  function getTemplatePath(templateId) {
    const template = templateId ? store.getTemplate(templateId) : null;
    if (!template) {
      return '…';
    }

    const segments = [template.name];
    let parentId = template.parentId;

    while (parentId) {
      const folder = store.getFolder(parentId);
      if (!folder) {
        break;
      }

      if (folder.id === store.ROOT_FOLDER_ID) {
        segments.unshift('…');
        break;
      }

      segments.unshift(folder.name);
      parentId = folder.parentId;
    }

    return segments.join(' / ');
  }

  function setLoadedTemplate(templateId, { shouldApply = false, shouldNotify = true } = {}) {
    const template = store.getTemplate(templateId);
    if (!isValidBorderTemplate(template)) {
      return null;
    }

    state.loadedTemplateId = template.id;
    persistSelection(template.id);

    if (shouldApply) {
      applyTemplatePayload?.(template.data);
    }

    resetDirty();

    if (shouldNotify) {
      onTemplateLoaded?.(template);
    }

    return template;
  }

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
    onStoreChanged: () => {
      persistLibrary();
    },
    onTemplateLoaded: (template) => {
      setLoadedTemplate(template?.id, { shouldApply: true, shouldNotify: true });
    },
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
    onStoreChanged: () => {
      persistLibrary();
    },
    onTemplateSaved: (template) => {
      if (!template || template.immutable) {
        return;
      }

      const updated = store.updateTemplate(template.id, {
        data: getTemplatePayload(),
        templateClass: BORDER_TEMPLATE_CLASS,
      });

      if (!updated) {
        return;
      }

      setLoadedTemplate(updated.id, { shouldApply: false, shouldNotify: false });
      persistLibrary();
      onTemplateSaved?.(updated);
    },
  });

  async function init() {
    try {
      const snapshot = await restoreTemplateLibraryFromIndexedDb();
      if (snapshot) {
        store.deserialize(snapshot);
      }
    } catch (error) {
      console.warn('Unable to initialize template library persistence.', error);
    }

    const selectedTemplateId = readSelectedTemplateIdentifier();
    const selectedTemplate = selectedTemplateId ? store.getTemplate(selectedTemplateId) : null;
    const templateToLoad = isValidBorderTemplate(selectedTemplate)
      ? selectedTemplate
      : store.getTemplate(DEFAULT_BORDER_TEMPLATE_ID);

    if (templateToLoad) {
      setLoadedTemplate(templateToLoad.id, { shouldApply: true, shouldNotify: true });
    }

    await persistLibrary();
  }

  function getSaveDialogSelectionTemplateId() {
    if (state.loadedTemplateId && state.loadedTemplateId !== DEFAULT_BORDER_TEMPLATE_ID) {
      return state.loadedTemplateId;
    }

    return null;
  }

  return {
    init,
    openLoadWindow: () => loadWindowController.open({ selectedTemplateId: state.loadedTemplateId }),
    closeLoadWindow: () => loadWindowController.close(),
    handleLoadEnterKey: (event) => loadWindowController.handleEnterKey(event),
    openSaveWindow: () => saveWindowController.open({ selectedTemplateId: getSaveDialogSelectionTemplateId() }),
    closeSaveWindow: () => saveWindowController.close(),
    handleSaveEnterKey: (event) => saveWindowController.handleEnterKey(event),
    markDirty,
    getLoadedTemplateId: () => state.loadedTemplateId,
    isDirty: () => state.isDirty,
    getLoadedTemplate,
    getLoadedTemplatePath: () => getTemplatePath(state.loadedTemplateId),
  };
}
