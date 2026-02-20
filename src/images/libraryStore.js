const ROOT_FOLDER_ID = 'folder-root';
const ROOT_FOLDER_NAME = 'All Images';

function createRootFolder() {
  return {
    id: ROOT_FOLDER_ID,
    type: 'folder',
    name: ROOT_FOLDER_NAME,
    parentId: null,
    orderIndex: 0,
    nonDeletable: true,
  };
}

function sortByOrderIndex(a, b) {
  if (a.orderIndex === b.orderIndex) {
    return a.id.localeCompare(b.id);
  }

  return a.orderIndex - b.orderIndex;
}

function cloneFolder(folder) {
  return { ...folder };
}

function cloneImage(image) {
  return { ...image };
}

export function createImageLibraryStore(serializedState = null) {
  let idCounter = 0;
  const folders = new Map([[ROOT_FOLDER_ID, createRootFolder()]]);
  const images = new Map();

  function nextId(prefix) {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  }

  function ensureParentFolder(parentId) {
    const resolvedParentId = parentId || ROOT_FOLDER_ID;

    if (!folders.has(resolvedParentId)) {
      throw new Error(`Unknown parent folder: ${resolvedParentId}`);
    }

    return resolvedParentId;
  }

  function getSiblings(parentId, entityType, skipId = null) {
    const collection = entityType === 'folder' ? folders : images;
    return Array.from(collection.values())
      .filter((entry) => entry.parentId === parentId && entry.id !== skipId)
      .sort(sortByOrderIndex);
  }

  function normalizeSiblingIndexes(parentId, entityType) {
    getSiblings(parentId, entityType).forEach((entry, index) => {
      entry.orderIndex = index;
    });
  }

  function resolveOrderIndex(parentId, entityType, requestedIndex, skipId = null) {
    const siblings = getSiblings(parentId, entityType, skipId);
    const fallbackIndex = siblings.length;

    if (!Number.isFinite(requestedIndex)) {
      return fallbackIndex;
    }

    return Math.max(0, Math.min(siblings.length, Math.floor(requestedIndex)));
  }

  function insertWithOrderIndex(entity, entityType, targetParentId, targetIndex, skipId = null) {
    const siblings = getSiblings(targetParentId, entityType, skipId);
    const insertAt = resolveOrderIndex(targetParentId, entityType, targetIndex, skipId);

    siblings.splice(insertAt, 0, entity);
    siblings.forEach((sibling, index) => {
      sibling.orderIndex = index;
      sibling.parentId = targetParentId;
    });
  }

  function createFolder({ name, parentId = ROOT_FOLDER_ID, orderIndex } = {}) {
    const resolvedParentId = ensureParentFolder(parentId);
    const folder = {
      id: nextId('folder'),
      type: 'folder',
      name: name || 'Untitled Folder',
      parentId: resolvedParentId,
      orderIndex: 0,
      nonDeletable: false,
    };

    folders.set(folder.id, folder);
    insertWithOrderIndex(folder, 'folder', resolvedParentId, orderIndex);
    return cloneFolder(folder);
  }

  function updateFolder(folderId, updates = {}) {
    const folder = folders.get(folderId);

    if (!folder) {
      return null;
    }

    if (typeof updates.name === 'string') {
      folder.name = updates.name;
    }

    return cloneFolder(folder);
  }

  function deleteFolder(folderId) {
    if (folderId === ROOT_FOLDER_ID) {
      return false;
    }

    const folder = folders.get(folderId);

    if (!folder) {
      return false;
    }

    const childFolders = Array.from(folders.values())
      .filter((entry) => entry.parentId === folderId)
      .map((entry) => entry.id);

    childFolders.forEach((childFolderId) => {
      deleteFolder(childFolderId);
    });

    Array.from(images.values())
      .filter((entry) => entry.parentId === folderId)
      .forEach((entry) => images.delete(entry.id));

    folders.delete(folderId);
    normalizeSiblingIndexes(folder.parentId, 'folder');
    return true;
  }

  function createImage({
    name,
    parentId = ROOT_FOLDER_ID,
    orderIndex,
    image = null,
    dataUrl = null,
    mimeType = null,
  } = {}) {
    const resolvedParentId = ensureParentFolder(parentId);
    const entry = {
      id: nextId('image'),
      type: 'image',
      name: name || 'Untitled Image',
      parentId: resolvedParentId,
      orderIndex: 0,
      image,
      dataUrl,
      mimeType,
    };

    images.set(entry.id, entry);
    insertWithOrderIndex(entry, 'image', resolvedParentId, orderIndex);
    return cloneImage(entry);
  }

  function updateImage(imageId, updates = {}) {
    const imageEntry = images.get(imageId);

    if (!imageEntry) {
      return null;
    }

    if (typeof updates.name === 'string') {
      imageEntry.name = updates.name;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'image')) {
      imageEntry.image = updates.image;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'dataUrl')) {
      imageEntry.dataUrl = updates.dataUrl || null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'mimeType')) {
      imageEntry.mimeType = updates.mimeType || null;
    }

    return cloneImage(imageEntry);
  }

  function deleteImage(imageId) {
    const imageEntry = images.get(imageId);

    if (!imageEntry) {
      return false;
    }

    images.delete(imageId);
    normalizeSiblingIndexes(imageEntry.parentId, 'image');
    return true;
  }

  function moveEntity(entityType, entityId, { parentId, orderIndex } = {}) {
    const collection = entityType === 'folder' ? folders : images;
    const entity = collection.get(entityId);

    if (!entity || (entityType === 'folder' && entityId === ROOT_FOLDER_ID)) {
      return null;
    }

    const targetParentId = ensureParentFolder(parentId || entity.parentId);

    if (entityType === 'folder') {
      let currentParentId = targetParentId;
      while (currentParentId) {
        if (currentParentId === entityId) {
          throw new Error('Cannot move a folder into itself.');
        }

        currentParentId = folders.get(currentParentId)?.parentId || null;
      }
    }

    const sourceParentId = entity.parentId;
    insertWithOrderIndex(entity, entityType, targetParentId, orderIndex, entity.id);

    if (sourceParentId !== targetParentId) {
      normalizeSiblingIndexes(sourceParentId, entityType);
    }

    return entityType === 'folder' ? cloneFolder(entity) : cloneImage(entity);
  }

  function reorderEntity(entityType, entityId, orderIndex) {
    return moveEntity(entityType, entityId, { orderIndex });
  }

  function listChildren(parentId = ROOT_FOLDER_ID) {
    const resolvedParentId = ensureParentFolder(parentId);
    const folderChildren = getSiblings(resolvedParentId, 'folder').map(cloneFolder);
    const imageChildren = getSiblings(resolvedParentId, 'image').map(cloneImage);
    return { folders: folderChildren, images: imageChildren };
  }

  function getFolder(folderId) {
    const folder = folders.get(folderId);
    return folder ? cloneFolder(folder) : null;
  }

  function getImage(imageId) {
    const imageEntry = images.get(imageId);
    return imageEntry ? cloneImage(imageEntry) : null;
  }

  function listAllImages() {
    return Array.from(images.values()).sort(sortByOrderIndex).map(cloneImage);
  }

  function serialize() {
    return {
      version: 1,
      idCounter,
      rootFolderId: ROOT_FOLDER_ID,
      folders: Array.from(folders.values()).map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        orderIndex: folder.orderIndex,
        nonDeletable: Boolean(folder.nonDeletable),
      })),
      images: Array.from(images.values()).map((imageEntry) => ({
        id: imageEntry.id,
        name: imageEntry.name,
        parentId: imageEntry.parentId,
        orderIndex: imageEntry.orderIndex,
        dataUrl: imageEntry.dataUrl || null,
        mimeType: imageEntry.mimeType || null,
      })),
    };
  }

  function deserialize(data) {
    folders.clear();
    images.clear();

    const parsedCounter = Number.parseInt(data?.idCounter, 10);
    idCounter = Number.isFinite(parsedCounter) && parsedCounter >= 0 ? parsedCounter : 0;

    folders.set(ROOT_FOLDER_ID, createRootFolder());

    const incomingFolders = Array.isArray(data?.folders) ? data.folders : [];
    incomingFolders.forEach((folder) => {
      if (!folder || folder.id === ROOT_FOLDER_ID || typeof folder.id !== 'string') {
        return;
      }

      folders.set(folder.id, {
        id: folder.id,
        type: 'folder',
        name: folder.name || 'Untitled Folder',
        parentId: folder.parentId,
        orderIndex: Number.isFinite(folder.orderIndex) ? Math.max(0, Math.floor(folder.orderIndex)) : 0,
        nonDeletable: Boolean(folder.nonDeletable),
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

    const incomingImages = Array.isArray(data?.images) ? data.images : [];
    incomingImages.forEach((imageEntry) => {
      if (!imageEntry || typeof imageEntry.id !== 'string') {
        return;
      }

      images.set(imageEntry.id, {
        id: imageEntry.id,
        type: 'image',
        name: imageEntry.name || 'Untitled Image',
        parentId: folders.has(imageEntry.parentId) ? imageEntry.parentId : ROOT_FOLDER_ID,
        orderIndex: Number.isFinite(imageEntry.orderIndex) ? Math.max(0, Math.floor(imageEntry.orderIndex)) : 0,
        image: null,
        dataUrl: typeof imageEntry.dataUrl === 'string' ? imageEntry.dataUrl : null,
        mimeType: typeof imageEntry.mimeType === 'string' ? imageEntry.mimeType : null,
      });
    });

    Array.from(folders.values()).forEach((folder) => {
      normalizeSiblingIndexes(folder.id, 'folder');
      normalizeSiblingIndexes(folder.id, 'image');
    });
  }

  function createSnapshot() {
    return {
      idCounter,
      folders: Array.from(folders.values()).map(cloneFolder),
      images: Array.from(images.values()).map(cloneImage),
    };
  }

  function restoreSnapshot(snapshot) {
    folders.clear();
    images.clear();

    idCounter = Number.isFinite(snapshot?.idCounter) ? snapshot.idCounter : 0;

    (snapshot?.folders || []).forEach((folder) => {
      folders.set(folder.id, { ...folder });
    });

    if (!folders.has(ROOT_FOLDER_ID)) {
      folders.set(ROOT_FOLDER_ID, createRootFolder());
    }

    (snapshot?.images || []).forEach((imageEntry) => {
      images.set(imageEntry.id, { ...imageEntry });
    });
  }

  if (serializedState) {
    deserialize(serializedState);
  }

  return {
    ROOT_FOLDER_ID,
    getRootFolder: () => getFolder(ROOT_FOLDER_ID),
    getFolder,
    getImage,
    listChildren,
    listAllImages,
    createFolder,
    updateFolder,
    deleteFolder,
    createImage,
    updateImage,
    deleteImage,
    moveFolder: (folderId, options) => moveEntity('folder', folderId, options),
    moveImage: (imageId, options) => moveEntity('image', imageId, options),
    reorderFolder: (folderId, orderIndex) => reorderEntity('folder', folderId, orderIndex),
    reorderImage: (imageId, orderIndex) => reorderEntity('image', imageId, orderIndex),
    serialize,
    deserialize,
    createSnapshot,
    restoreSnapshot,
  };
}

export function serializeImageLibraryStore(store) {
  return store.serialize();
}

export function deserializeImageLibraryStore(serializedState) {
  return createImageLibraryStore(serializedState);
}
