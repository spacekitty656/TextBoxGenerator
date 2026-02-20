function cloneNode(node) {
  return {
    ...node,
    children: Array.isArray(node.children) ? node.children.map(cloneNode) : undefined,
  };
}

function createIdGenerator(start = 1) {
  let current = start;
  return () => `node_${current++}`;
}

export function createLibraryStore(initialState = null) {
  const nextId = createIdGenerator(1);
  const root = initialState ? cloneNode(initialState) : { id: 'root', type: 'folder', name: 'Root', children: [] };

  function visit(node, callback) {
    if (!node) return null;
    const result = callback(node);
    if (result) return result;
    if (node.children) {
      for (const child of node.children) {
        const nested = visit(child, callback);
        if (nested) return nested;
      }
    }
    return null;
  }

  function findNode(id) {
    return visit(root, (node) => (node.id === id ? node : null));
  }

  function findParent(id, node = root) {
    if (!node.children) return null;
    if (node.children.some((child) => child.id === id)) return node;
    for (const child of node.children) {
      const parent = findParent(id, child);
      if (parent) return parent;
    }
    return null;
  }

  function createFolder(parentId, name) {
    const parent = findNode(parentId);
    if (!parent || parent.type !== 'folder') {
      throw new Error('Parent folder not found');
    }

    const folder = { id: nextId(), type: 'folder', name, children: [] };
    parent.children.push(folder);
    return folder;
  }

  function createImage(parentId, name, assetId) {
    const parent = findNode(parentId);
    if (!parent || parent.type !== 'folder') {
      throw new Error('Parent folder not found');
    }

    const image = { id: nextId(), type: 'image', name, assetId };
    parent.children.push(image);
    return image;
  }

  function renameNode(id, name) {
    const node = findNode(id);
    if (!node) {
      throw new Error('Node not found');
    }
    node.name = name;
    return node;
  }

  function moveNode(id, targetFolderId) {
    const parent = findParent(id);
    const target = findNode(targetFolderId);

    if (!parent || !target || target.type !== 'folder') {
      throw new Error('Unable to move node');
    }

    const index = parent.children.findIndex((child) => child.id === id);
    const [node] = parent.children.splice(index, 1);
    target.children.push(node);
    return node;
  }

  function deleteNode(id, mode = 'delete-all') {
    const parent = findParent(id);
    if (!parent) {
      throw new Error('Node not found');
    }

    const index = parent.children.findIndex((child) => child.id === id);
    const [removed] = parent.children.splice(index, 1);

    if (removed.type === 'folder' && mode === 'promote-children' && Array.isArray(removed.children)) {
      parent.children.splice(index, 0, ...removed.children);
    }

    return removed;
  }

  function getState() {
    return cloneNode(root);
  }

  return {
    createFolder,
    createImage,
    renameNode,
    moveNode,
    deleteNode,
    findNode,
    getState,
  };
}
