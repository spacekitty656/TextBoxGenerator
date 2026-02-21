const ROOT_FOLDER_ID = 'root';

function createIdGenerator(prefix) {
  return () => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTemplateLibraryStore() {
  const makeFolderId = createIdGenerator('folder');
  const makeTemplateId = createIdGenerator('template');

  const folders = new Map();
  const templates = new Map();

  folders.set(ROOT_FOLDER_ID, {
    id: ROOT_FOLDER_ID,
    type: 'folder',
    name: 'Templates',
    parentId: null,
    orderIndex: 0,
  });

  function listChildren(parentId = ROOT_FOLDER_ID) {
    const folderItems = [];
    const templateItems = [];

    folders.forEach((folder) => {
      if (folder.parentId === parentId) {
        folderItems.push(folder);
      }
    });

    templates.forEach((template) => {
      if (template.parentId === parentId) {
        templateItems.push(template);
      }
    });

    folderItems.sort((a, b) => a.orderIndex - b.orderIndex);
    templateItems.sort((a, b) => a.orderIndex - b.orderIndex);

    return { folders: folderItems, templates: templateItems };
  }

  function createFolder({ name, parentId = ROOT_FOLDER_ID }) {
    const siblings = listChildren(parentId).folders;
    const folder = {
      id: makeFolderId(),
      type: 'folder',
      name,
      parentId,
      orderIndex: siblings.length,
    };
    folders.set(folder.id, folder);
    return folder;
  }

  function createTemplate({ name, parentId = ROOT_FOLDER_ID, data = null }) {
    const siblings = listChildren(parentId).templates;
    const template = {
      id: makeTemplateId(),
      type: 'template',
      name,
      parentId,
      orderIndex: siblings.length,
      data,
    };
    templates.set(template.id, template);
    return template;
  }

  function updateFolder(id, updates = {}) {
    const folder = folders.get(id);
    if (!folder || id === ROOT_FOLDER_ID) {
      return null;
    }

    const next = { ...folder, ...updates };
    folders.set(id, next);
    return next;
  }

  function updateTemplate(id, updates = {}) {
    const template = templates.get(id);
    if (!template) {
      return null;
    }

    const next = { ...template, ...updates };
    templates.set(id, next);
    return next;
  }

  function deleteTemplate(id) {
    templates.delete(id);
  }

  function deleteFolder(id) {
    if (id === ROOT_FOLDER_ID) {
      return;
    }

    listChildren(id).folders.forEach((child) => deleteFolder(child.id));
    listChildren(id).templates.forEach((entry) => deleteTemplate(entry.id));
    folders.delete(id);
  }

  return {
    ROOT_FOLDER_ID,
    getRootFolder: () => folders.get(ROOT_FOLDER_ID) || null,
    getFolder: (id) => folders.get(id) || null,
    getTemplate: (id) => templates.get(id) || null,
    listChildren,
    createFolder,
    createTemplate,
    updateFolder,
    updateTemplate,
    deleteFolder,
    deleteTemplate,
  };
}
