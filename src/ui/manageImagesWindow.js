import { openWindowChoiceDialog } from './windowDialog.js';

const NEW_FOLDER_ROW_KEY = '__new-folder__';

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
    editor: null,
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

  function getVisibleRows() {
    const rows = [];

    function walkFolder(folder, depth) {
      rows.push({ ...folder, depth, synthetic: false, key: getEntityKey(folder) });

      if (state.collapsedFolderIds.has(folder.id)) {
        return;
      }

      listEntities(folder.id).forEach((child) => {
        if (child.type === 'folder') {
          walkFolder(child, depth + 1);
          return;
        }

        rows.push({ ...child, depth: depth + 1, synthetic: false, key: getEntityKey(child) });
      });

      if (state.editor?.mode === 'create-folder' && state.editor.parentId === folder.id) {
        rows.push({
          type: 'folder',
          id: NEW_FOLDER_ROW_KEY,
          name: state.editor.draftName,
          depth: depth + 1,
          synthetic: true,
          key: NEW_FOLDER_ROW_KEY,
          parentId: folder.id,
        });
      }
    }

    const root = store.getRootFolder();
    if (root) {
      walkFolder(root, 0);
    }

    return rows;
  }

  function getVisibleSelectionKeys() {
    return getVisibleRows()
      .filter((row) => !row.synthetic)
      .map((row) => row.key);
  }

  function syncToolbarState() {
    const hasSelection = state.selectedKeys.length > 0;
    const singleSelection = getSingleSelection();
    const isImage = singleSelection?.type === 'image';
    const isRoot = singleSelection?.type === 'folder' && singleSelection.id === store.ROOT_FOLDER_ID;

    elements.renameButton.disabled = !singleSelection || isMultiSelection() || isRoot || Boolean(state.editor);
    elements.refreshButton.disabled = !isImage || isMultiSelection() || Boolean(state.editor);
    elements.deleteButton.disabled = !hasSelection || Boolean(state.editor) || state.selectedKeys.some((key) => {
      const entry = getEntityByKey(key);
      return entry?.type === 'folder' && entry.id === store.ROOT_FOLDER_ID;
    });

    const inSlotMode = Boolean(state.activeSlot);
    elements.okButton.disabled = Boolean(singleSelection?.type === 'folder') || Boolean(state.editor)
      || (inSlotMode && (!isImage || isMultiSelection()));
  }

  function setSelection(keys, lastKey = null) {
    const normalized = Array.from(new Set(keys.filter((key) => Boolean(getEntityByKey(key)))));
    state.selectedKeys = normalized;
    state.lastSelectedKey = normalized.length ? (lastKey || normalized[normalized.length - 1]) : null;
    syncToolbarState();
  }

  function applyClickSelection(key, event = {}) {
    if (state.editor) {
      return;
    }

    const { ctrlKey = false, metaKey = false, shiftKey = false } = event;
    const toggleSelection = ctrlKey || metaKey;

    if (shiftKey && state.lastSelectedKey) {
      const orderedKeys = getVisibleSelectionKeys();
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

  function toggleFolderCollapsed(folderId, hasChildren = true) {
    if (!hasChildren) {
      return;
    }

    if (state.collapsedFolderIds.has(folderId)) {
      state.collapsedFolderIds.delete(folderId);
    } else {
      state.collapsedFolderIds.add(folderId);
    }
    renderTree();
  }

  function getPreferredFolderParentId() {
    const selected = getSingleSelection();

    if (!selected) {
      return store.ROOT_FOLDER_ID;
    }

    if (selected.type === 'folder') {
      return selected.id;
    }

    return selected.parentId || store.ROOT_FOLDER_ID;
  }

  function startCreateFolderInline() {
    const parentId = getPreferredFolderParentId();
    state.collapsedFolderIds.delete(parentId);
    state.editor = {
      mode: 'create-folder',
      parentId,
      draftName: 'Untitled Folder',
    };
    render();
  }

  function startRenameInline() {
    const selected = getSingleSelection();
    if (!selected || selected.id === store.ROOT_FOLDER_ID) {
      return;
    }

    state.editor = {
      mode: 'rename',
      key: getEntityKey(selected),
      draftName: selected.name,
    };

    render();
  }

  function cancelInlineEdit() {
    state.editor = null;
    render();
  }

  function commitInlineEdit(value) {
    if (!state.editor) {
      return;
    }

    const nextName = String(value || '').trim();

    if (state.editor.mode === 'create-folder') {
      if (!nextName) {
        state.editor = null;
        render();
        return;
      }

      const created = store.createFolder({
        name: nextName,
        parentId: state.editor.parentId,
      });

      state.editor = null;
      onStoreChanged?.();
      setSelection([getEntityKey(created)], getEntityKey(created));
      render();
      return;
    }

    const entity = getEntityByKey(state.editor.key);
    if (entity && nextName) {
      if (entity.type === 'folder') {
        store.updateFolder(entity.id, { name: nextName });
      } else {
        store.updateImage(entity.id, { name: nextName });
      }
      onStoreChanged?.();
    }

    state.editor = null;
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

  async function addImagesFromFiles(fileList, parentId = getPreferredFolderParentId()) {
    const files = Array.from(fileList || []).filter((file) => file?.type?.startsWith('image/'));
    const createdKeys = [];

    for (const file of files) {
      try {
        const loaded = await loadImageFromFile(file);
        const createdImage = store.createImage({
          name: file.name,
          parentId,
          image: loaded.image,
          dataUrl: loaded.dataUrl,
          mimeType: loaded.mimeType,
        });
        createdKeys.push(getEntityKey(createdImage));
      } catch (error) {
        console.error('Unable to import selected image.', error);
      }
    }

    if (createdKeys.length > 0) {
      const selectedKey = createdKeys[createdKeys.length - 1];
      setSelection([selectedKey], selectedKey);
    }

    onStoreChanged?.();
    render();
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

  async function requestDelete() {
    const selections = state.selectedKeys.map(getEntityByKey).filter(Boolean);
    if (!selections.length) {
      return;
    }

    const selectedImages = selections.filter((entry) => entry.type === 'image');
    const selectedFolders = selections.filter((entry) => entry.type === 'folder' && entry.id !== store.ROOT_FOLDER_ID);

    if (selectedImages.length) {
      const response = await openWindowChoiceDialog({
        title: 'Delete Image',
        message: 'Deleting image(s) may break references in border slots. Consider using Refresh instead. Continue?',
        buttons: [
          { label: 'Delete Image(s)', value: 'delete', variant: 'primary' },
          { label: 'Cancel', value: 'cancel', variant: 'secondary' },
        ],
      });

      if (response !== 'delete') {
        return;
      }
    }

    selectedImages.forEach((imageEntry) => {
      store.deleteImage(imageEntry.id);
    });

    for (const folder of selectedFolders) {
      const children = store.listChildren(folder.id);
      const hasChildren = (children.folders.length + children.images.length) > 0;
      const buttons = hasChildren
        ? [
          { label: 'Delete Folder and Children', value: 'delete', variant: 'primary' },
          { label: 'Delete Folder and move Children to Parent', value: 'move', variant: 'secondary' },
          { label: 'Cancel', value: 'cancel', variant: 'secondary' },
        ]
        : [
          { label: 'Delete Folder', value: 'delete', variant: 'primary' },
          { label: 'Cancel', value: 'cancel', variant: 'secondary' },
        ];

      const response = await openWindowChoiceDialog({
        title: 'Delete Folder',
        message: hasChildren
          ? 'Choose how to handle this folder and its children.'
          : 'Delete this folder?',
        buttons,
      });

      if (response === 'delete') {
        deleteFolderWithStrategy(folder, 'delete');
      } else if (response === 'move') {
        deleteFolderWithStrategy(folder, 'move');
      }
    }

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
        createMenuItem('Refresh', requestRefresh),
        createMenuItem('Rename', startRenameInline),
        createMenuItem('Delete', requestDelete),
      );
    } else {
      elements.contextMenu.append(
        createMenuItem('Rename', startRenameInline),
        createMenuItem('Delete', requestDelete),
      );
    }

    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
    elements.contextMenu.classList.remove('hidden');
  }

  function renderTree() {
    const rows = getVisibleRows();
    elements.tree.innerHTML = '';

    rows.forEach((entry) => {
      const row = document.createElement('div');
      const key = entry.key || getEntityKey(entry);
      const folderChildren = entry.type === 'folder' && !entry.synthetic ? store.listChildren(entry.id) : null;
      const hasFolderChildren = Boolean(folderChildren)
        && (folderChildren.folders.length + folderChildren.images.length) > 0;
      const isCollapsed = entry.type === 'folder' && !entry.synthetic && state.collapsedFolderIds.has(entry.id);
      const isSelected = state.selectedKeys.includes(key);
      const isRenameEditing = state.editor?.mode === 'rename' && state.editor.key === key;
      const isCreateEditing = entry.synthetic && state.editor?.mode === 'create-folder';
      const isEditing = isRenameEditing || isCreateEditing;

      row.className = 'manage-tree-row';
      row.dataset.entityKey = key;
      row.draggable = !entry.synthetic && entry.id !== store.ROOT_FOLDER_ID && !state.editor;
      row.style.paddingLeft = `${entry.depth * 18 + 8}px`;

      if (isSelected) {
        row.classList.add('active');
      }

      const toggleMarkup = entry.type === 'folder'
        ? `<button type="button" class="manage-tree-toggle" aria-label="Toggle folder" ${hasFolderChildren ? '' : 'disabled'}>${hasFolderChildren ? (isCollapsed ? '▸' : '▾') : '•'}</button>`
        : '<span class="manage-tree-toggle-spacer"></span>';
      const icon = entry.type === 'folder' ? '📁' : '🖼️';
      const nameMarkup = isEditing
        ? `<input type="text" class="manage-tree-rename-input" value="${escapeHtml(state.editor?.draftName || entry.name)}" />`
        : `<span class="manage-tree-name">${escapeHtml(entry.name)}</span>`;

      row.innerHTML = `${toggleMarkup}<span class="manage-tree-icon">${icon}</span>${nameMarkup}`;

      row.addEventListener('click', (event) => {
        if (event.target.closest('.manage-tree-toggle') || event.target.closest('.manage-tree-rename-input')) {
          return;
        }

        if (entry.synthetic) {
          return;
        }

        applyClickSelection(key, event);
        renderTree();
      });

      row.addEventListener('dblclick', (event) => {
        if (entry.synthetic || state.editor) {
          return;
        }

        if (entry.type === 'folder') {
          event.preventDefault();
          toggleFolderCollapsed(entry.id, hasFolderChildren);
          return;
        }

        if (entry.type !== 'image') {
          return;
        }

        event.preventDefault();
        applyClickSelection(key, event);
        renderTree();
        applySelection();
      });

      row.addEventListener('contextmenu', (event) => {
        if (entry.synthetic || state.editor) {
          return;
        }

        event.preventDefault();
        applyClickSelection(key, event);
        renderTree();
        showContextMenu(event.clientX, event.clientY, entry);
      });

      if (entry.type === 'folder' && !entry.synthetic) {
        const toggleButton = row.querySelector('.manage-tree-toggle');
        toggleButton?.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleFolderCollapsed(entry.id, hasFolderChildren);
        });
      }

      if (isEditing) {
        const renameInput = row.querySelector('.manage-tree-rename-input');
        requestAnimationFrame(() => {
          renameInput?.focus();
          renameInput?.select();
        });

        const commitRenameAndClose = () => {
          state.editor = {
            ...state.editor,
            draftName: renameInput.value,
          };
          commitInlineEdit(renameInput.value);
        };

        renameInput?.addEventListener('mousedown', (event) => {
          event.stopPropagation();
        });

        renameInput?.addEventListener('click', (event) => {
          event.stopPropagation();
        });

        renameInput?.addEventListener('input', () => {
          if (state.editor) {
            state.editor.draftName = renameInput.value;
          }
        });

        renameInput?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitRenameAndClose();
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            cancelInlineEdit();
          }
        });

        renameInput?.addEventListener('blur', () => {
          if (state.editor) {
            commitRenameAndClose();
          }
        });
      }

      row.addEventListener('dragstart', (event) => {
        if (!row.draggable) {
          event.preventDefault();
          return;
        }

        state.draggedKey = key;
        event.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragover', (event) => {
        if (state.editor) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      });

      row.addEventListener('drop', (event) => {
        if (state.editor) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (entry.synthetic) {
          return;
        }

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
    state.editor = null;
    hideContextMenu();
    elements.overlay.classList.add('hidden');
    elements.overlay.setAttribute('aria-hidden', 'true');
    setSelection([]);
  }

  function handleEnterKey(event = null) {
    if (!state.isOpen) {
      return false;
    }

    const target = event?.target;
    if (state.editor || target?.closest?.('.manage-tree-rename-input')) {
      return false;
    }

    applySelection();
    return true;
  }

  function handleDeleteKey(event = null) {
    if (!state.isOpen) {
      return false;
    }

    const target = event?.target;
    if (state.editor || target?.closest?.('.manage-tree-rename-input')) {
      return false;
    }

    if (elements.deleteButton.disabled) {
      return false;
    }

    elements.deleteButton.click();
    return true;
  }

  elements.tree.addEventListener('dragover', (event) => {
    if (state.editor) {
      return;
    }

    event.preventDefault();
  });

  elements.tree.addEventListener('drop', (event) => {
    if (state.editor) {
      return;
    }

    if (event.target.closest('.manage-tree-row')) {
      return;
    }

    event.preventDefault();
    moveDraggedEntity(store.ROOT_FOLDER_ID);
  });

  elements.tree.addEventListener('click', (event) => {
    if (state.editor) {
      return;
    }

    if (!event.target.closest('.manage-tree-row') && state.selectedKeys.length > 0) {
      setSelection([]);
      renderTree();
    }
  });

  elements.importButton.addEventListener('click', () => {
    if (!state.editor) {
      elements.input.click();
    }
  });
  elements.createFolderButton.addEventListener('click', startCreateFolderInline);
  elements.renameButton.addEventListener('click', startRenameInline);
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
      store.updateImage(targetImageId, {
        image: loaded.image,
        dataUrl: loaded.dataUrl,
        mimeType: loaded.mimeType,
        name: file.name,
      });
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
    handleDeleteKey,
  };
}
