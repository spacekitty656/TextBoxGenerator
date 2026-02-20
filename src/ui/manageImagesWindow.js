function getEntityKey(entity) {
  if (!entity) {
    return '';
  }

  return `${entity.type}:${entity.id}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createManageImagesWindowController({
  store,
  loadImageFromFile,
  elements,
  onSelectionApplied,
  onStoreChanged,
  onImagesDeleted,
}) {
  const state = {
    isOpen: false,
    activeSlot: null,
    selectedKeys: [],
    lastSelectedKey: null,
    collapsedFolderIds: new Set(),
    draggedKey: null,
    editingKey: null,
  };

  function listEntities(parentId) {
    const children = store.listChildren(parentId);
    return [...children.folders, ...children.images].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  function getEntityByKey(key) {
    const [type, id] = String(key || '').split(':');
    if (type === 'folder') {
      return store.getFolder(id);
    }

    if (type === 'image') {
      return store.getImage(id);
    }

    return null;
  }

  function isMultiSelection() {
    return state.selectedKeys.length > 1;
  }

  function getSingleSelection() {
    if (state.selectedKeys.length !== 1) {
      return null;
    }

    return getEntityByKey(state.selectedKeys[0]);
  }

  function buildVisibleTree() {
    const rows = [];

    function walk(folderId, depth) {
      listEntities(folderId).forEach((entry) => {
        rows.push({ ...entry, depth });

        if (entry.type === 'folder' && !state.collapsedFolderIds.has(entry.id)) {
          walk(entry.id, depth + 1);
        }
      });
    }

    const root = store.getRootFolder();
    if (root) {
      rows.push({ ...root, depth: 0 });
      if (!state.collapsedFolderIds.has(root.id)) {
        walk(root.id, 1);
      }
    }

    return rows;
  }

  function getVisibleKeys() {
    return buildVisibleTree().map((entry) => getEntityKey(entry));
  }

  function syncToolbarState() {
    const hasSelection = state.selectedKeys.length > 0;
    const singleSelection = getSingleSelection();
    const isImage = singleSelection?.type === 'image';
    const isRoot = singleSelection?.type === 'folder' && singleSelection.id === store.ROOT_FOLDER_ID;

    elements.renameButton.disabled = !singleSelection || isMultiSelection() || isRoot;
    elements.refreshButton.disabled = !isImage || isMultiSelection();
    elements.deleteButton.disabled = !hasSelection || state.selectedKeys.some((key) => {
      const entry = getEntityByKey(key);
      return entry?.type === 'folder' && entry.id === store.ROOT_FOLDER_ID;
    });

    const inSlotMode = Boolean(state.activeSlot);
    elements.okButton.disabled = Boolean(singleSelection?.type === 'folder') || (inSlotMode && (!isImage || isMultiSelection()));
  }

  function setSelection(keys, lastKey = null) {
    const normalized = Array.from(new Set(keys.filter((key) => Boolean(getEntityByKey(key)))));
    state.selectedKeys = normalized;
    state.lastSelectedKey = normalized.length ? (lastKey || normalized[normalized.length - 1]) : null;
    syncToolbarState();
  }

  function applyClickSelection(key, event = {}) {
    const { ctrlKey = false, metaKey = false, shiftKey = false } = event;
    const toggleSelection = ctrlKey || metaKey;

    if (shiftKey && state.lastSelectedKey) {
      const orderedKeys = getVisibleKeys();
      const start = orderedKeys.indexOf(state.lastSelectedKey);
      const end = orderedKeys.indexOf(key);

      if (start >= 0 && end >= 0) {
        const [min, max] = start < end ? [start, end] : [end, start];
        setSelection(orderedKeys.slice(min, max + 1), key);
        return;
      }
    }

    if (toggleSelection) {
      if (state.selectedKeys.includes(key)) {
        setSelection(state.selectedKeys.filter((entry) => entry !== key));
      } else {
        setSelection([...state.selectedKeys, key], key);
      }
      return;
    }

    setSelection([key], key);
  }

  function canDropToFolder(folderId) {
    if (!folderId) {
      return false;
    }

    let current = store.getFolder(folderId);
    while (current) {
      if (current.id === store.ROOT_FOLDER_ID) {
        return true;
      }

      current = current.parentId ? store.getFolder(current.parentId) : null;
    }

    return false;
  }

  function moveDraggedEntity(targetParentId, targetIndex = undefined) {
    const dragged = getEntityByKey(state.draggedKey);
    if (!dragged || !canDropToFolder(targetParentId)) {
      return;
    }

    if (dragged.type === 'folder') {
      store.moveFolder(dragged.id, { parentId: targetParentId, orderIndex: targetIndex });
    } else {
      store.moveImage(dragged.id, { parentId: targetParentId, orderIndex: targetIndex });
    }

    onStoreChanged?.();
    render();
  }

  function getPreferredParentFolderId() {
    const selected = getSingleSelection();
    if (!selected) {
      return store.ROOT_FOLDER_ID;
    }

    if (selected.type === 'folder') {
      return selected.id;
    }

    return selected.parentId || store.ROOT_FOLDER_ID;
  }

  async function addImagesFromFiles(fileList, parentId = getPreferredParentFolderId()) {
    const files = Array.from(fileList || []).filter((file) => file?.type?.startsWith('image/'));

    for (const file of files) {
      try {
        const loaded = await loadImageFromFile(file);
        store.createImage({ name: file.name, parentId, image: loaded });
      } catch (error) {
        console.error('Unable to import selected image.', error);
      }
    }

    onStoreChanged?.();
    render();
  }

  function requestCreateFolder() {
    const name = window.prompt('Folder name:', 'Untitled Folder');
    if (!name) {
      return;
    }

    store.createFolder({
      name: name.trim() || 'Untitled Folder',
      parentId: getPreferredParentFolderId(),
    });
    onStoreChanged?.();
    render();
  }

  function commitInlineRename(key, nameValue) {
    const entity = getEntityByKey(key);
    if (!entity || entity.id === store.ROOT_FOLDER_ID) {
      return;
    }

    const nextName = String(nameValue || '').trim();
    if (!nextName) {
      return;
    }

    if (entity.type === 'folder') {
      store.updateFolder(entity.id, { name: nextName });
    } else {
      store.updateImage(entity.id, { name: nextName });
    }

    onStoreChanged?.();
  }

  function startInlineRename() {
    const selected = getSingleSelection();
    if (!selected || selected.id === store.ROOT_FOLDER_ID) {
      return;
    }

    state.editingKey = getEntityKey(selected);
    render();
  }

  function stopInlineRename() {
    state.editingKey = null;
    render();
  }

  function requestRefresh() {
    const selected = getSingleSelection();
    if (!selected || selected.type !== 'image') {
      return;
    }

    elements.refreshInput.dataset.targetImageId = selected.id;
    elements.refreshInput.click();
  }

  function deleteFolderWithStrategy(folder, strategy) {
    const snapshot = store.createSnapshot();
    const children = store.listChildren(folder.id);

    if (strategy === 'move') {
      children.folders.forEach((childFolder, index) => {
        store.moveFolder(childFolder.id, { parentId: folder.parentId, orderIndex: index });
      });
      children.images.forEach((childImage, index) => {
        store.moveImage(childImage.id, { parentId: folder.parentId, orderIndex: index });
      });
      store.deleteFolder(folder.id);
      return;
    }

    if (strategy === 'delete') {
      store.deleteFolder(folder.id);
      return;
    }

    store.restoreSnapshot(snapshot);
  }

  function requestDelete() {
    const selections = state.selectedKeys.map(getEntityByKey).filter(Boolean);
    if (!selections.length) {
      return;
    }

    const selectedImages = selections.filter((entry) => entry.type === 'image');
    const selectedFolders = selections.filter((entry) => entry.type === 'folder' && entry.id !== store.ROOT_FOLDER_ID);

    if (selectedImages.length) {
      const confirmed = window.confirm(
        'Deleting image(s) may break references in border slots. Consider using Refresh instead. Continue?',
      );

      if (!confirmed) {
        return;
      }
    }

    selectedImages.forEach((imageEntry) => {
      store.deleteImage(imageEntry.id);
    });

    selectedFolders.forEach((folder) => {
      const response = window.prompt(
        `Delete folder "${folder.name}"\n1) Delete Folder and Children\n2) Delete Folder and move Children to Parent\n3) Cancel`,
        '3',
      );

      if (response === '1') {
        deleteFolderWithStrategy(folder, 'delete');
      } else if (response === '2') {
        deleteFolderWithStrategy(folder, 'move');
      }
    });

    onImagesDeleted?.(selectedImages.map((entry) => entry.id));
    setSelection([]);
    onStoreChanged?.();
    render();
  }

  function createMenuItem(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'manage-images-context-action';
    button.role = 'menuitem';
    button.textContent = label;
    button.addEventListener('click', () => {
      hideContextMenu();
      action();
    });
    return button;
  }

  function hideContextMenu() {
    elements.contextMenu.classList.add('hidden');
    elements.contextMenu.innerHTML = '';
  }

  function showContextMenu(x, y, entity) {
    elements.contextMenu.innerHTML = '';

    if (entity.type === 'image') {
      elements.contextMenu.append(
        createMenuItem('Refresh', () => requestRefresh()),
        createMenuItem('Rename', () => startInlineRename()),
        createMenuItem('Delete', () => requestDelete()),
      );
    } else {
      elements.contextMenu.append(
        createMenuItem('Rename', () => startInlineRename()),
        createMenuItem('Delete', () => requestDelete()),
      );
    }

    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
    elements.contextMenu.classList.remove('hidden');
  }

  function renderTree() {
    const rows = buildVisibleTree();
    elements.tree.innerHTML = '';

    rows.forEach((entry) => {
      const row = document.createElement('div');
      const key = getEntityKey(entry);
      const hasFolderChildren = entry.type === 'folder' && store.listChildren(entry.id).folders.length > 0;
      const isCollapsed = entry.type === 'folder' && state.collapsedFolderIds.has(entry.id);

      row.className = 'manage-tree-row';
      row.dataset.entityKey = key;
      row.draggable = entry.id !== store.ROOT_FOLDER_ID;
      row.style.paddingLeft = `${entry.depth * 18 + 8}px`;

      if (state.selectedKeys.includes(key)) {
        row.classList.add('active');
      }

      const chevron = entry.type === 'folder'
        ? `<button type="button" class="manage-tree-toggle" aria-label="Toggle folder" ${hasFolderChildren ? '' : 'disabled'}>${hasFolderChildren ? (isCollapsed ? '▸' : '▾') : '•'}</button>`
        : '<span class="manage-tree-toggle-spacer"></span>';

      const icon = entry.type === 'folder' ? '📁' : '🖼️';
      const isEditing = state.editingKey === key;
      const nameMarkup = isEditing
        ? `<input type="text" class="manage-tree-rename-input" value="${escapeHtml(entry.name)}" />`
        : `<span class="manage-tree-name">${escapeHtml(entry.name)}</span>`;

      row.innerHTML = `${chevron}<span class="manage-tree-icon">${icon}</span>${nameMarkup}`;

      row.addEventListener('click', (event) => {
        if (event.target.closest('.manage-tree-toggle')) {
          return;
        }

        applyClickSelection(key, event);
        renderTree();
      });

      row.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        applyClickSelection(key, event);
        renderTree();
        showContextMenu(event.clientX, event.clientY, entry);
      });

      if (entry.type === 'folder') {
        const toggleButton = row.querySelector('.manage-tree-toggle');
        toggleButton?.addEventListener('click', (event) => {
          event.stopPropagation();
          if (!hasFolderChildren) {
            return;
          }

          if (isCollapsed) {
            state.collapsedFolderIds.delete(entry.id);
          } else {
            state.collapsedFolderIds.add(entry.id);
          }

          renderTree();
        });
      }

      if (isEditing) {
        const renameInput = row.querySelector('.manage-tree-rename-input');
        renameInput?.focus();
        renameInput?.select();

        const commitRenameAndClose = () => {
          commitInlineRename(key, renameInput.value);
          state.editingKey = null;
          render();
        };

        renameInput?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitRenameAndClose();
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            stopInlineRename();
          }
        });

        renameInput?.addEventListener('blur', () => {
          commitRenameAndClose();
        });
      }

      row.addEventListener('dragstart', () => {
        state.draggedKey = key;
      });

      row.addEventListener('dragover', (event) => {
        event.preventDefault();
      });

      row.addEventListener('drop', (event) => {
        event.preventDefault();

        if (entry.type === 'folder' && state.draggedKey !== key) {
          moveDraggedEntity(entry.id);
          return;
        }

        const targetParentId = entry.parentId || store.ROOT_FOLDER_ID;
        moveDraggedEntity(targetParentId, entry.orderIndex);
      });

      elements.tree.appendChild(row);
    });

    syncToolbarState();
  }

  function applySelection() {
    if (!state.activeSlot) {
      close();
      return;
    }

    const selected = getSingleSelection();
    if (!selected || selected.type !== 'image') {
      return;
    }

    onSelectionApplied?.(state.activeSlot, selected.id);
    close();
  }

  function render() {
    renderTree();
    syncToolbarState();
  }

  function open({ slotType = null, slotName = null, initialImageId = null } = {}) {
    state.isOpen = true;
    state.activeSlot = slotType && slotName ? { slotType, slotName } : null;

    elements.overlay.classList.remove('hidden');
    elements.overlay.setAttribute('aria-hidden', 'false');

    if (initialImageId) {
      const key = `image:${initialImageId}`;
      setSelection([key], key);
    } else {
      setSelection([]);
    }

    render();
  }

  function close() {
    state.isOpen = false;
    state.activeSlot = null;
    state.editingKey = null;
    hideContextMenu();
    elements.overlay.classList.add('hidden');
    elements.overlay.setAttribute('aria-hidden', 'true');
    setSelection([]);
  }

  function handleEnterKey() {
    if (!state.isOpen) {
      return false;
    }

    applySelection();
    return true;
  }

  elements.tree.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  elements.tree.addEventListener('drop', (event) => {
    event.preventDefault();
    moveDraggedEntity(store.ROOT_FOLDER_ID);
  });

  elements.importButton.addEventListener('click', () => elements.input.click());
  elements.createFolderButton.addEventListener('click', requestCreateFolder);
  elements.renameButton.addEventListener('click', startInlineRename);
  elements.refreshButton.addEventListener('click', requestRefresh);
  elements.deleteButton.addEventListener('click', requestDelete);
  elements.okButton.addEventListener('click', applySelection);
  elements.cancelButton.addEventListener('click', close);
  elements.closeButton.addEventListener('click', close);

  elements.input.addEventListener('change', async () => {
    await addImagesFromFiles(elements.input.files);
    elements.input.value = '';
  });

  elements.refreshInput.addEventListener('change', async () => {
    const targetImageId = elements.refreshInput.dataset.targetImageId;
    const [file] = Array.from(elements.refreshInput.files || []);
    elements.refreshInput.value = '';
    elements.refreshInput.dataset.targetImageId = '';

    if (!targetImageId || !file) {
      return;
    }

    try {
      const loaded = await loadImageFromFile(file);
      store.updateImage(targetImageId, { image: loaded, name: file.name });
      onStoreChanged?.();
      render();
    } catch (error) {
      console.error('Unable to refresh selected image.', error);
    }
  });

  document.addEventListener('click', (event) => {
    if (!elements.contextMenu.contains(event.target)) {
      hideContextMenu();
    }
  });

  elements.overlay.addEventListener('click', (event) => {
    if (event.target === elements.overlay) {
      close();
    }
  });

  return {
    open,
    close,
    render,
    handleEnterKey,
  };
}
