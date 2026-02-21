const ROOT_FOLDER_ID = 'root';

function createIdGenerator(prefix) {
  return () => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByOrderIndex(items) {
  return items.sort((a, b) => a.orderIndex - b.orderIndex);
}

function cloneEntity(entity) {
  return entity ? { ...entity } : null;
}

export function createHierarchicalTemplateStore({
  rootFolderName = 'Templates',
  defaultFolders = [],
  defaultTemplates = [],
} = {}) {
  const makeFolderId = createIdGenerator('folder');
  const makeTemplateId = createIdGenerator('template');

  const folders = new Map();
  const templates = new Map();

  function setRootFolder() {
    folders.set(ROOT_FOLDER_ID, {
      id: ROOT_FOLDER_ID,
      type: 'folder',
      name: rootFolderName,
      parentId: null,
      orderIndex: 0,
      immutable: true,
    });
  }

  setRootFolder();

  function listChildren(parentId = ROOT_FOLDER_ID, { templateClass = null } = {}) {
    const folderItems = [];
    const templateItems = [];

    folders.forEach((folder) => {
      if (folder.parentId === parentId) {
        folderItems.push(cloneEntity(folder));
      }
    });

    templates.forEach((template) => {
      if (template.parentId === parentId && (!templateClass || template.templateClass === templateClass)) {
        templateItems.push(cloneEntity(template));
      }
    });

    return {
      folders: sortByOrderIndex(folderItems),
      templates: sortByOrderIndex(templateItems),
    };
  }

  function listTemplatesByClass(templateClass) {
    const classTemplates = [];

    templates.forEach((template) => {
      if (!templateClass || template.templateClass === templateClass) {
        classTemplates.push(cloneEntity(template));
      }
    });

    return sortByOrderIndex(classTemplates);
  }

  function getFolder(id) {
    return cloneEntity(folders.get(id));
  }

  function getTemplate(id) {
    return cloneEntity(templates.get(id));
  }

  function createFolder({ id = null, name, parentId = ROOT_FOLDER_ID, orderIndex = null, immutable = false }) {
    if (!folders.has(parentId)) {
      return null;
    }

    const siblings = listChildren(parentId).folders;
    const folder = {
      id: id || makeFolderId(),
      type: 'folder',
      name,
      parentId,
      orderIndex: Number.isFinite(orderIndex) ? orderIndex : siblings.length,
      immutable: Boolean(immutable),
    };
    folders.set(folder.id, folder);
    return cloneEntity(folder);
  }

  function createTemplate({
    id = null,
    name,
    parentId = ROOT_FOLDER_ID,
    orderIndex = null,
    data = null,
    templateClass = 'border',
    immutable = false,
  }) {
    if (!folders.has(parentId)) {
      return null;
    }

    const siblings = listChildren(parentId).templates;
    const template = {
      id: id || makeTemplateId(),
      type: 'template',
      name,
      parentId,
      orderIndex: Number.isFinite(orderIndex) ? orderIndex : siblings.length,
      templateClass,
      data,
      immutable: Boolean(immutable),
    };
    templates.set(template.id, template);
    return cloneEntity(template);
  }

  function updateFolder(id, updates = {}) {
    const folder = folders.get(id);
    if (!folder || id === ROOT_FOLDER_ID || folder.immutable) {
      return null;
    }

    const next = {
      ...folder,
      name: typeof updates.name === 'string' ? updates.name : folder.name,
    };

    folders.set(id, next);
    return cloneEntity(next);
  }

  function updateTemplate(id, updates = {}) {
    const template = templates.get(id);
    if (!template || template.immutable) {
      return null;
    }

    const next = {
      ...template,
      ...updates,
      templateClass: updates.templateClass || template.templateClass,
    };

    templates.set(id, next);
    return cloneEntity(next);
  }

  function moveTemplate(id, parentId) {
    const template = templates.get(id);
    if (!template || template.immutable || !folders.has(parentId)) {
      return null;
    }

    const siblings = listChildren(parentId).templates;
    const next = {
      ...template,
      parentId,
      orderIndex: siblings.length,
    };

    templates.set(id, next);
    return cloneEntity(next);
  }

  function deleteTemplate(id) {
    const template = templates.get(id);
    if (!template || template.immutable) {
      return false;
    }

    templates.delete(id);
    return true;
  }

  function deleteFolder(id) {
    const folder = folders.get(id);
    if (!folder || id === ROOT_FOLDER_ID || folder.immutable) {
      return false;
    }

    listChildren(id).folders.forEach((child) => {
      deleteFolder(child.id);
    });

    listChildren(id).templates.forEach((entry) => {
      deleteTemplate(entry.id);
    });

    folders.delete(id);
    return true;
  }

  function serialize() {
    return {
      rootFolderName,
      folders: Array.from(folders.values()).map((entry) => ({ ...entry })),
      templates: Array.from(templates.values()).map((entry) => ({ ...entry })),
    };
  }

  function deserialize(snapshot = {}) {
    folders.clear();
    templates.clear();
    setRootFolder();

    const snapshotFolders = Array.isArray(snapshot.folders) ? snapshot.folders : [];
    const snapshotTemplates = Array.isArray(snapshot.templates) ? snapshot.templates : [];

    snapshotFolders.forEach((folder) => {
      if (!folder || folder.id === ROOT_FOLDER_ID || typeof folder.id !== 'string') {
        return;
      }

      if (!folders.has(folder.parentId || ROOT_FOLDER_ID)) {
        return;
      }

      folders.set(folder.id, {
        id: folder.id,
        type: 'folder',
        name: folder.name || 'Untitled Folder',
        parentId: folder.parentId || ROOT_FOLDER_ID,
        orderIndex: Number.isFinite(folder.orderIndex) ? folder.orderIndex : 0,
        immutable: Boolean(folder.immutable),
      });
    });

    snapshotTemplates.forEach((template) => {
      if (!template || typeof template.id !== 'string') {
        return;
      }

      const parentId = template.parentId || ROOT_FOLDER_ID;
      if (!folders.has(parentId)) {
        return;
      }

      templates.set(template.id, {
        id: template.id,
        type: 'template',
        name: template.name || 'Untitled Template',
        parentId,
        orderIndex: Number.isFinite(template.orderIndex) ? template.orderIndex : 0,
        templateClass: template.templateClass || 'border',
        data: Object.prototype.hasOwnProperty.call(template, 'data') ? template.data : null,
        immutable: Boolean(template.immutable),
      });
    });

    defaultFolders.forEach((folder) => {
      if (folder?.id && !folders.has(folder.id)) {
        createFolder({ ...folder, immutable: true });
      }
    });

    defaultTemplates.forEach((template) => {
      if (template?.id && !templates.has(template.id)) {
        createTemplate({ ...template, immutable: true });
      }
    });
  }

  defaultFolders.forEach((folder) => {
    if (folder?.id && !folders.has(folder.id)) {
      createFolder({ ...folder, immutable: true });
    }
  });

  defaultTemplates.forEach((template) => {
    if (template?.id && !templates.has(template.id)) {
      createTemplate({ ...template, immutable: true });
    }
  });

  return {
    ROOT_FOLDER_ID,
    getRootFolder: () => getFolder(ROOT_FOLDER_ID),
    getFolder,
    getTemplate,
    listChildren,
    listTemplatesByClass,
    createFolder,
    createTemplate,
    updateFolder,
    updateTemplate,
    moveTemplate,
    deleteFolder,
    deleteTemplate,
    serialize,
    deserialize,
  };
}
