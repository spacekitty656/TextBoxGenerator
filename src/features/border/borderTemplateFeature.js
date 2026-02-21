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
    activeTemplateId: DEFAULT_BORDER_TEMPLATE_ID,
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

  function setActiveTemplate(templateId, { shouldNotify = true } = {}) {
    const template = store.getTemplate(templateId);
    if (!isValidBorderTemplate(template)) {
      return null;
    }

    state.activeTemplateId = template.id;
    persistSelection(template.id);

    applyTemplatePayload?.(template.data);

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
      setActiveTemplate(template?.id, { shouldNotify: true });
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

      setActiveTemplate(updated.id, { shouldNotify: false });
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
      setActiveTemplate(templateToLoad.id, { shouldNotify: true });
    }

    await persistLibrary();
  }

  return {
    init,
    openLoadWindow: () => loadWindowController.open(),
    closeLoadWindow: () => loadWindowController.close(),
    handleLoadEnterKey: (event) => loadWindowController.handleEnterKey(event),
    openSaveWindow: () => saveWindowController.open({
      selectedTemplateId: state.activeTemplateId !== DEFAULT_BORDER_TEMPLATE_ID ? state.activeTemplateId : null,
      collapseToSelectionAncestors: state.activeTemplateId !== DEFAULT_BORDER_TEMPLATE_ID,
    }),
    closeSaveWindow: () => saveWindowController.close(),
    handleSaveEnterKey: (event) => saveWindowController.handleEnterKey(event),
  };
}
