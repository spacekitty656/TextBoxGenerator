const ROOT_FOLDER_ID = 'root';

export const FONT_ROOT_FOLDER_NAME = 'All Fonts';

export const DEFAULT_EDITOR_FONTS = [
  { id: 'font-sansserif', value: 'sansserif', name: 'Sans Serif', family: 'Arial, Helvetica, sans-serif' },
  { id: 'font-serif', value: 'serif', name: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'font-monospace', value: 'monospace', name: 'Monospace', family: '"Courier New", Courier, monospace' },
  { id: 'font-pressstart2p', value: 'pressstart2p', name: 'Press Start 2P', family: '"Press Start 2P", "Courier New", monospace' },
];

function cloneEntity(entity) {
  return entity ? { ...entity } : null;
}

function sortByOrderIndex(a, b) {
  if (a.orderIndex === b.orderIndex) {
    return a.id.localeCompare(b.id);
  }

  return a.orderIndex - b.orderIndex;
}

export function createFontLibraryStore() {
  const folders = new Map();
  const fonts = new Map();

  let folderCounter = 0;
  let fontCounter = 0;

  function createFolderId() {
    folderCounter += 1;
    return `folder-${folderCounter}`;
  }

  function createFontId() {
    fontCounter += 1;
    return `font-${fontCounter}`;
  }

  function setRootFolder() {
    folders.set(ROOT_FOLDER_ID, {
      id: ROOT_FOLDER_ID,
      type: 'folder',
      name: FONT_ROOT_FOLDER_NAME,
      parentId: null,
      orderIndex: 0,
      immutable: true,
    });
  }

  function ensureParentFolder(parentId = ROOT_FOLDER_ID) {
    const resolvedParentId = parentId || ROOT_FOLDER_ID;
    if (!folders.has(resolvedParentId)) {
      throw new Error(`Unknown parent folder: ${resolvedParentId}`);
    }

    return resolvedParentId;
  }

  function listEntityReferences(parentId = ROOT_FOLDER_ID) {
    const entries = [];

    folders.forEach((folder) => {
      if (folder.parentId === parentId) {
        entries.push(folder);
      }
    });

    fonts.forEach((font) => {
      if (font.parentId === parentId) {
        entries.push(font);
      }
    });

    return entries.sort(sortByOrderIndex);
  }

  function resequenceParent(parentId = ROOT_FOLDER_ID) {
    listEntityReferences(parentId).forEach((entry, index) => {
      if (entry.type === 'folder') {
        folders.set(entry.id, { ...entry, orderIndex: index });
      } else {
        fonts.set(entry.id, { ...entry, orderIndex: index });
      }
    });
  }

  function insertAtParent(parentId, entryType, entryId, targetIndex = null) {
    const siblings = listEntityReferences(parentId);
    const boundedIndex = Number.isFinite(targetIndex)
      ? Math.max(0, Math.min(siblings.length, targetIndex))
      : siblings.length;

    siblings.forEach((entry) => {
      if (entry.orderIndex >= boundedIndex) {
        const nextOrder = entry.orderIndex + 1;
        if (entry.type === 'folder') {
          folders.set(entry.id, { ...entry, orderIndex: nextOrder });
        } else {
          fonts.set(entry.id, { ...entry, orderIndex: nextOrder });
        }
      }
    });

    if (entryType === 'folder') {
      const folder = folders.get(entryId);
      folders.set(entryId, { ...folder, parentId, orderIndex: boundedIndex });
    } else {
      const font = fonts.get(entryId);
      fonts.set(entryId, { ...font, parentId, orderIndex: boundedIndex });
    }

    resequenceParent(parentId);
  }

  function listChildren(parentId = ROOT_FOLDER_ID) {
    const resolvedParentId = ensureParentFolder(parentId);

    const folderItems = [];
    const fontItems = [];

    folders.forEach((folder) => {
      if (folder.parentId === resolvedParentId) {
        folderItems.push(cloneEntity(folder));
      }
    });

    fonts.forEach((font) => {
      if (font.parentId === resolvedParentId) {
        fontItems.push(cloneEntity(font));
      }
    });

    return {
      folders: folderItems.sort(sortByOrderIndex),
      fonts: fontItems.sort(sortByOrderIndex),
    };
  }

  function listFonts() {
    const entries = [];
    fonts.forEach((font) => {
      entries.push(cloneEntity(font));
    });

    return entries.sort(sortByOrderIndex);
  }

  function getRootFolder() {
    return cloneEntity(folders.get(ROOT_FOLDER_ID));
  }

  function getFolder(folderId) {
    return cloneEntity(folders.get(folderId));
  }

  function getFont(fontId) {
    return cloneEntity(fonts.get(fontId));
  }

  function createFolder({ id = null, name = 'Untitled Folder', parentId = ROOT_FOLDER_ID, orderIndex = null, immutable = false } = {}) {
    const resolvedParentId = ensureParentFolder(parentId);
    const folderId = id || createFolderId();

    folders.set(folderId, {
      id: folderId,
      type: 'folder',
      name,
      parentId: resolvedParentId,
      orderIndex: 0,
      immutable: Boolean(immutable),
    });

    insertAtParent(resolvedParentId, 'folder', folderId, orderIndex);
    return cloneEntity(folders.get(folderId));
  }

  function createFont({
    id = null,
    name = 'Untitled Font',
    parentId = ROOT_FOLDER_ID,
    orderIndex = null,
    immutable = false,
    data = null,
  } = {}) {
    const resolvedParentId = ensureParentFolder(parentId);
    const fontId = id || createFontId();

    fonts.set(fontId, {
      id: fontId,
      type: 'font',
      name,
      parentId: resolvedParentId,
      orderIndex: 0,
      immutable: Boolean(immutable),
      data,
    });

    insertAtParent(resolvedParentId, 'font', fontId, orderIndex);
    return cloneEntity(fonts.get(fontId));
  }

  function updateFolder(folderId, updates = {}) {
    const folder = folders.get(folderId);
    if (!folder || folder.id === ROOT_FOLDER_ID || folder.immutable) {
      return null;
    }

    const next = {
      ...folder,
      name: typeof updates.name === 'string' ? updates.name : folder.name,
    };

    folders.set(folderId, next);
    return cloneEntity(next);
  }

  function updateFont(fontId, updates = {}) {
    const font = fonts.get(fontId);
    if (!font || font.immutable) {
      return null;
    }

    const next = {
      ...font,
      name: typeof updates.name === 'string' ? updates.name : font.name,
      data: Object.prototype.hasOwnProperty.call(updates, 'data') ? updates.data : font.data,
    };

    fonts.set(fontId, next);
    return cloneEntity(next);
  }

  function deleteFolder(folderId) {
    const folder = folders.get(folderId);
    if (!folder || folderId === ROOT_FOLDER_ID || folder.immutable) {
      return false;
    }

    listChildren(folderId).folders.forEach((childFolder) => {
      deleteFolder(childFolder.id);
    });

    listChildren(folderId).fonts.forEach((childFont) => {
      deleteFont(childFont.id);
    });

    folders.delete(folderId);
    resequenceParent(folder.parentId || ROOT_FOLDER_ID);
    return true;
  }

  function deleteFont(fontId) {
    const font = fonts.get(fontId);
    if (!font || font.immutable) {
      return false;
    }

    fonts.delete(fontId);
    resequenceParent(font.parentId || ROOT_FOLDER_ID);
    return true;
  }

  function serialize() {
    return {
      version: 1,
      folderCounter,
      fontCounter,
      rootFolderName: FONT_ROOT_FOLDER_NAME,
      folders: Array.from(folders.values()).map((entry) => ({ ...entry })),
      fonts: Array.from(fonts.values()).map((entry) => ({ ...entry })),
    };
  }

  function deserialize(snapshot = {}) {
    folders.clear();
    fonts.clear();

    setRootFolder();

    const parsedFolderCounter = Number.parseInt(snapshot.folderCounter, 10);
    folderCounter = Number.isFinite(parsedFolderCounter) && parsedFolderCounter >= 0 ? parsedFolderCounter : 0;

    const parsedFontCounter = Number.parseInt(snapshot.fontCounter, 10);
    fontCounter = Number.isFinite(parsedFontCounter) && parsedFontCounter >= 0 ? parsedFontCounter : 0;

    const incomingFolders = Array.isArray(snapshot.folders) ? snapshot.folders : [];
    incomingFolders.forEach((folder) => {
      if (!folder || typeof folder.id !== 'string' || folder.id === ROOT_FOLDER_ID) {
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

    Array.from(folders.values()).forEach((folder) => {
      if (folder.id === ROOT_FOLDER_ID) {
        return;
      }

      if (!folders.has(folder.parentId)) {
        folder.parentId = ROOT_FOLDER_ID;
      }
    });

    const incomingFonts = Array.isArray(snapshot.fonts) ? snapshot.fonts : [];

    incomingFonts.forEach((font) => {
      if (!font || typeof font.id !== 'string') {
        return;
      }

      const parentId = folders.has(font.parentId) ? font.parentId : ROOT_FOLDER_ID;
      fonts.set(font.id, {
        id: font.id,
        type: 'font',
        name: font.name || 'Untitled Font',
        parentId,
        orderIndex: Number.isFinite(font.orderIndex) ? font.orderIndex : 0,
        immutable: Boolean(font.immutable),
        data: font.data || null,
      });
    });

    Array.from(folders.keys()).forEach((folderId) => {
      resequenceParent(folderId);
    });

    DEFAULT_EDITOR_FONTS.forEach((font, index) => {
      if (!fonts.has(font.id)) {
        createFont({
          id: font.id,
          name: font.name,
          parentId: ROOT_FOLDER_ID,
          orderIndex: index,
          immutable: true,
          data: {
            value: font.value,
            family: font.family,
            familyName: font.name,
            sourceBlob: null,
          },
        });
      }
    });
  }

  setRootFolder();

  DEFAULT_EDITOR_FONTS.forEach((font, index) => {
    createFont({
      id: font.id,
      name: font.name,
      parentId: ROOT_FOLDER_ID,
      orderIndex: index,
      immutable: true,
      data: {
        value: font.value,
        family: font.family,
        familyName: font.name,
        sourceBlob: null,
      },
    });
  });

  return {
    ROOT_FOLDER_ID,
    getRootFolder,
    getFolder,
    getFont,
    listChildren,
    listFonts,
    createFolder,
    createFont,
    updateFolder,
    updateFont,
    deleteFolder,
    deleteFont,
    serialize,
    deserialize,
  };
}
