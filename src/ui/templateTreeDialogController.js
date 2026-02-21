import { openWindowChoiceDialog } from './windowDialog.js';

const NEW_ROW_KEY = '__new-entry__';

function getEntityKey(entity) {
  return entity ? `${entity.type}:${entity.id}` : '';
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createTemplateTreeDialogController({
  store,
  elements,
  mode,
  onStoreChanged,
  onLoadTemplate,
  onSaveTemplate,
}) {
  const state = {
    isOpen: false,
    selectedKey: null,
    collapsedFolderIds: new Set(),
    editor: null,
    draggedKey: null,
    dragHover: null,
  };

  function listEntities(parentId) {
    const children = store.listChildren(parentId);
    return [...children.folders, ...children.templates].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  function getEntityByKey(key) {
    const [type, id] = String(key || '').split(':');
    if (type === 'folder') {
      return store.getFolder(id);
    }

    if (type === 'template') {
      return store.getTemplate(id);
    }

    return null;
  }

  function getVisibleRows() {
    const rows = [];

    function walk(folder, depth) {
      rows.push({ ...folder, depth, key: getEntityKey(folder), synthetic: false });
      if (state.collapsedFolderIds.has(folder.id)) {
        return;
      }

      listEntities(folder.id).forEach((child) => {
        if (child.type === 'folder') {
          walk(child, depth + 1);
        } else {
          rows.push({ ...child, depth: depth + 1, key: getEntityKey(child), synthetic: false });
        }
      });

      if (state.editor?.mode === 'create-folder' && state.editor.parentId === folder.id) {
        rows.push({
          type: 'folder',
          id: NEW_ROW_KEY,
          key: NEW_ROW_KEY,
          synthetic: true,
          depth: depth + 1,
          name: state.editor.draftName,
          parentId: folder.id,
        });
      }

      if (state.editor?.mode === 'create-template' && state.editor.parentId === folder.id) {
        rows.push({
          type: 'template',
          id: NEW_ROW_KEY,
          key: NEW_ROW_KEY,
          synthetic: true,
          depth: depth + 1,
          name: state.editor.draftName,
          parentId: folder.id,
        });
      }
    }

    const root = store.getRootFolder();
    if (root) {
      walk(root, 0);
    }

    return rows;
  }

  function getSingleSelection() {
    return getEntityByKey(state.selectedKey);
  }

  function getEntitySiblings(parentId) {
    const children = store.listChildren(parentId);
    return [...children.folders, ...children.templates].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  function resolveDropPlacement(targetEntry, clientY) {
    const row = elements.tree.querySelector(`[data-entity-key="${targetEntry.key}"]`);
    if (!row) {
      return { targetKey: targetEntry.key, mode: targetEntry.type === 'folder' ? 'inside' : 'after' };
    }

    const { top, height } = row.getBoundingClientRect();
    const offset = clientY - top;

    if (targetEntry.type === 'folder') {
      if (offset < height * 0.25) {
        return { targetKey: targetEntry.key, mode: 'before' };
      }

      if (offset > height * 0.75) {
        return { targetKey: targetEntry.key, mode: 'after' };
      }

      return { targetKey: targetEntry.key, mode: 'inside' };
    }

    return { targetKey: targetEntry.key, mode: offset < height * 0.5 ? 'before' : 'after' };
  }

  function isValidDropTarget(source, target, mode) {
    if (!source || !target || source.id === target.id) {
      return false;
    }

    if (source.immutable || target.synthetic) {
      return false;
    }

    if (mode === 'inside') {
      return target.type === 'folder';
    }

    if (mode === 'before' || mode === 'after') {
      if (target.type === 'folder' && target.id === store.ROOT_FOLDER_ID) {
        return false;
      }

      return true;
    }

    return false;
  }

  function moveEntityFromDrop(source, target, mode) {
    if (!source || !target) {
      return false;
    }

    if (mode === 'inside' && target.type === 'folder') {
      if (source.type === 'folder') {
        return Boolean(store.moveFolder(source.id, target.id));
      }

      return Boolean(store.moveTemplate(source.id, target.id));
    }

    const targetParentId = target.parentId || store.ROOT_FOLDER_ID;
    const siblings = getEntitySiblings(targetParentId);
    const targetIndex = siblings.findIndex((entry) => entry.id === target.id && entry.type === target.type);

    if (targetIndex < 0) {
      return false;
    }

    const insertIndex = mode === 'after' ? targetIndex + 1 : targetIndex;

    if (source.type === 'folder') {
      return Boolean(store.moveFolder(source.id, targetParentId, insertIndex));
    }

    return Boolean(store.moveTemplate(source.id, targetParentId, insertIndex));
  }

  function getAncestorFolderIdsForTemplate(templateId) {
    const template = store.getTemplate(templateId);
    if (!template) {
      return [];
    }

    const ancestorIds = [];
    let parentId = template.parentId;

    while (parentId) {
      const folder = store.getFolder(parentId);
      if (!folder) {
        break;
      }

      ancestorIds.push(folder.id);
      parentId = folder.parentId;
    }

    return ancestorIds;
  }

  function collapseToTemplateAncestors(templateId) {
    const ancestorSet = new Set(getAncestorFolderIdsForTemplate(templateId));

    getVisibleRows().forEach((entry) => {
      if (entry.type !== 'folder' || entry.synthetic) {
        return;
      }

      if (entry.id === store.ROOT_FOLDER_ID || ancestorSet.has(entry.id)) {
        state.collapsedFolderIds.delete(entry.id);
        return;
      }

      state.collapsedFolderIds.add(entry.id);
    });
  }

  function getVisibleSelectionKeys() {
    return getVisibleRows().filter((row) => !row.synthetic).map((row) => row.key);
  }

  function moveSelectionByOffset(offset) {
    const keys = getVisibleSelectionKeys();
    if (!keys.length) {
      return;
    }

    const currentIndex = state.selectedKey ? keys.indexOf(state.selectedKey) : -1;
    const nextIndex = Math.max(0, Math.min(keys.length - 1, currentIndex + offset));
    setSelection(keys[nextIndex]);
    renderTree();
  }

  function setSelection(key) {
    state.selectedKey = getEntityByKey(key) ? key : null;
    syncToolbarState();
  }

  function syncToolbarState() {
    const selected = getSingleSelection();
    const isRoot = selected?.type === 'folder' && selected.id === store.ROOT_FOLDER_ID;
    const isImmutable = Boolean(selected?.immutable);

    if (elements.createTemplateButton) {
      elements.createTemplateButton.disabled = Boolean(state.editor);
    }
    elements.createFolderButton.disabled = Boolean(state.editor);
    elements.renameButton.disabled = !selected || isRoot || isImmutable || Boolean(state.editor);
    elements.deleteButton.disabled = !selected || isRoot || isImmutable || Boolean(state.editor);
    elements.primaryButton.disabled = selected?.type !== 'template'
      || Boolean(state.editor)
      || (mode === 'save' && isImmutable);
  }

  function getPreferredParentId() {
    const selected = getSingleSelection();
    if (!selected) {
      return store.ROOT_FOLDER_ID;
    }

    return selected.type === 'folder' ? selected.id : selected.parentId;
  }

  function startCreateFolderInline() {
    const parentId = getPreferredParentId();
    state.collapsedFolderIds.delete(parentId);
    state.editor = { mode: 'create-folder', parentId, draftName: 'Untitled Folder' };
    render();
  }

  function startCreateTemplateInline() {
    if (!elements.createTemplateButton) {
      return;
    }

    const parentId = getPreferredParentId();
    state.collapsedFolderIds.delete(parentId);
    state.editor = { mode: 'create-template', parentId, draftName: 'Untitled Template' };
    render();
  }

  function startRenameInline() {
    const selected = getSingleSelection();
    if (!selected || selected.id === store.ROOT_FOLDER_ID) {
      return;
    }

    state.editor = {
      mode: 'rename',
      key: state.selectedKey,
      draftName: selected.name,
    };
    render();
  }

  function commitInlineEdit(value) {
    if (!state.editor) {
      return;
    }

    const nextName = String(value || '').trim();
    if (!nextName) {
      state.editor = null;
      render();
      return;
    }

    if (state.editor.mode === 'create-folder') {
      const created = store.createFolder({ name: nextName, parentId: state.editor.parentId });
      state.editor = null;
      setSelection(getEntityKey(created));
      onStoreChanged?.();
      render();
      return;
    }

    if (state.editor.mode === 'create-template') {
      const created = store.createTemplate({ name: nextName, parentId: state.editor.parentId });
      state.editor = null;
      setSelection(getEntityKey(created));
      onStoreChanged?.();
      render();
      return;
    }

    const selected = getEntityByKey(state.editor.key);
    if (selected?.type === 'folder') {
      store.updateFolder(selected.id, { name: nextName });
    }

    if (selected?.type === 'template') {
      store.updateTemplate(selected.id, { name: nextName });
    }

    state.editor = null;
    onStoreChanged?.();
    render();
  }

  async function requestDelete() {
    const selected = getSingleSelection();
    if (!selected || selected.id === store.ROOT_FOLDER_ID || selected.immutable) {
      return;
    }

    const isFolder = selected.type === 'folder';
    const response = await openWindowChoiceDialog({
      title: isFolder ? 'Delete Folder' : 'Delete Template',
      message: isFolder ? 'Delete this folder and all child templates?' : 'Delete this template?',
      buttons: [
        { label: 'Delete', value: 'delete', variant: 'primary' },
        { label: 'Cancel', value: 'cancel', variant: 'secondary' },
      ],
    });

    if (response !== 'delete') {
      return;
    }

    if (isFolder) {
      store.deleteFolder(selected.id);
    } else {
      store.deleteTemplate(selected.id);
    }

    setSelection(null);
    onStoreChanged?.();
    render();
  }

  function runPrimaryAction() {
    const selected = getSingleSelection();
    if (!selected || selected.type !== 'template') {
      return;
    }

    if (mode === 'load') {
      onLoadTemplate?.(selected);
    }

    if (mode === 'save') {
      if (selected.immutable) {
        return;
      }

      onSaveTemplate?.(selected);
    }

    close();
  }

  function hideContextMenu() {
    elements.contextMenu.classList.add('hidden');
    elements.contextMenu.innerHTML = '';
  }

  function renderContextMenu(x, y) {
    const selected = getSingleSelection();
    if (!selected || selected.id === store.ROOT_FOLDER_ID || selected.immutable) {
      return;
    }

    elements.contextMenu.innerHTML = '';

    const rename = document.createElement('button');
    rename.type = 'button';
    rename.className = 'manage-images-context-action';
    rename.textContent = 'Rename';
    rename.addEventListener('click', () => {
      hideContextMenu();
      startRenameInline();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'manage-images-context-action';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      hideContextMenu();
      requestDelete();
    });

    elements.contextMenu.append(rename, del);
    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
    elements.contextMenu.classList.remove('hidden');
  }

  function renderTree() {
    elements.tree.innerHTML = '';

    getVisibleRows().forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'manage-tree-row';
      row.dataset.entityKey = entry.key;
      row.style.paddingLeft = `${entry.depth * 18 + 8}px`;

      if (entry.key === state.selectedKey) {
        row.classList.add('active');
      }

      const folderChildren = entry.type === 'folder' && !entry.synthetic ? listEntities(entry.id) : [];
      const hasChildren = folderChildren.length > 0;
      const isCollapsed = entry.type === 'folder' && state.collapsedFolderIds.has(entry.id);
      const isEditing = (state.editor?.mode === 'rename' && state.editor.key === entry.key) || entry.synthetic;

      const toggleMarkup = entry.type === 'folder'
        ? `<button type="button" class="manage-tree-toggle" aria-label="Toggle folder" ${hasChildren ? '' : 'disabled'}>${hasChildren ? (isCollapsed ? '▸' : '▾') : '•'}</button>`
        : '<span class="manage-tree-toggle-spacer"></span>';
      const icon = entry.type === 'folder' ? '📁' : '📄';
      const nameMarkup = isEditing
        ? `<input type="text" class="manage-tree-rename-input" value="${escapeHtml(state.editor?.draftName || entry.name)}" />`
        : `<span class="manage-tree-name">${escapeHtml(entry.name)}</span>`;

      row.innerHTML = `${toggleMarkup}<span class="manage-tree-icon">${icon}</span>${nameMarkup}`;

      const isDraggable = !entry.synthetic && entry.id !== store.ROOT_FOLDER_ID && !entry.immutable && !state.editor;
      row.draggable = isDraggable;

      if (state.dragHover?.targetKey === entry.key && state.dragHover?.mode) {
        row.classList.add(`manage-tree-drop-${state.dragHover.mode}`);
      }

      row.addEventListener('dragstart', (event) => {
        if (!isDraggable) {
          event.preventDefault();
          return;
        }

        state.draggedKey = entry.key;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', entry.key);
        row.classList.add('manage-tree-row-dragging');
      });

      row.addEventListener('dragend', () => {
        state.draggedKey = null;
        state.dragHover = null;
        renderTree();
      });

      row.addEventListener('dragover', (event) => {
        if (!state.draggedKey || state.editor) {
          return;
        }

        const source = getEntityByKey(state.draggedKey);
        const placement = resolveDropPlacement(entry, event.clientY);

        if (!isValidDropTarget(source, entry, placement.mode)) {
          return;
        }

        event.preventDefault();
        state.dragHover = placement;
        renderTree();
      });

      row.addEventListener('dragleave', (event) => {
        if (!row.contains(event.relatedTarget) && state.dragHover?.targetKey === entry.key) {
          state.dragHover = null;
          renderTree();
        }
      });

      row.addEventListener('drop', (event) => {
        if (!state.draggedKey || state.editor) {
          return;
        }

        const source = getEntityByKey(state.draggedKey);
        const placement = resolveDropPlacement(entry, event.clientY);
        if (!isValidDropTarget(source, entry, placement.mode)) {
          return;
        }

        event.preventDefault();
        const moved = moveEntityFromDrop(source, entry, placement.mode);
        state.draggedKey = null;
        state.dragHover = null;

        if (!moved) {
          renderTree();
          return;
        }

        setSelection(getEntityKey(source));
        onStoreChanged?.();
        render();
      });

      row.addEventListener('click', (event) => {
        if (event.target.closest('.manage-tree-toggle') || event.target.closest('.manage-tree-rename-input') || entry.synthetic) {
          return;
        }

        setSelection(entry.key);
        renderTree();
      });

      row.addEventListener('dblclick', (event) => {
        if (entry.synthetic || state.editor) {
          return;
        }

        event.preventDefault();
        setSelection(entry.key);
        if (entry.type === 'folder') {
          if (state.collapsedFolderIds.has(entry.id)) {
            state.collapsedFolderIds.delete(entry.id);
          } else {
            state.collapsedFolderIds.add(entry.id);
          }
          renderTree();
          return;
        }

        runPrimaryAction();
      });

      row.addEventListener('contextmenu', (event) => {
        if (entry.synthetic || state.editor) {
          return;
        }

        event.preventDefault();
        setSelection(entry.key);
        renderTree();
        renderContextMenu(event.clientX, event.clientY);
      });

      if (entry.type === 'folder') {
        row.querySelector('.manage-tree-toggle')?.addEventListener('click', (event) => {
          event.stopPropagation();
          if (hasChildren) {
            if (state.collapsedFolderIds.has(entry.id)) {
              state.collapsedFolderIds.delete(entry.id);
            } else {
              state.collapsedFolderIds.add(entry.id);
            }
            renderTree();
          }
        });
      }

      if (isEditing) {
        const input = row.querySelector('.manage-tree-rename-input');
        requestAnimationFrame(() => {
          input?.focus();
          input?.select();
        });

        input?.addEventListener('input', () => {
          if (state.editor) {
            state.editor.draftName = input.value;
          }
        });

        input?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitInlineEdit(input.value);
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            state.editor = null;
            render();
          }
        });

        input?.addEventListener('blur', () => {
          if (state.editor) {
            commitInlineEdit(input.value);
          }
        });
      }

      elements.tree.appendChild(row);
    });

    syncToolbarState();
  }

  function render() {
    renderTree();
    syncToolbarState();
  }

  function open({ selectedTemplateId = null } = {}) {
    state.isOpen = true;

    if (selectedTemplateId && store.getTemplate(selectedTemplateId)) {
      collapseToTemplateAncestors(selectedTemplateId);
      setSelection(getEntityKey(store.getTemplate(selectedTemplateId)));
    }

    elements.overlay.classList.remove('hidden');
    elements.overlay.setAttribute('aria-hidden', 'false');

    if (!state.selectedKey) {
      const firstVisible = getVisibleSelectionKeys()[0] || null;
      setSelection(firstVisible);
    }

    render();
    elements.tree.focus();
  }

  function close() {
    state.isOpen = false;
    state.editor = null;
    state.draggedKey = null;
    state.dragHover = null;
    setSelection(null);
    hideContextMenu();
    elements.overlay.classList.add('hidden');
    elements.overlay.setAttribute('aria-hidden', 'true');
  }

  function handleEnterKey(event = null) {
    if (!state.isOpen || state.editor || event?.target?.closest?.('.manage-tree-rename-input')) {
      return false;
    }

    runPrimaryAction();
    return true;
  }

  elements.tree.tabIndex = 0;
  elements.tree.addEventListener('keydown', (event) => {
    if (!state.isOpen || state.editor) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelectionByOffset(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelectionByOffset(-1);
      return;
    }

    const selected = getSingleSelection();
    if (!selected || selected.type !== 'folder') {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      state.collapsedFolderIds.add(selected.id);
      renderTree();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      state.collapsedFolderIds.delete(selected.id);
      renderTree();
    }
  });

  elements.createFolderButton.addEventListener('click', startCreateFolderInline);
  elements.renameButton.addEventListener('click', startRenameInline);
  elements.deleteButton.addEventListener('click', requestDelete);
  elements.primaryButton.addEventListener('click', runPrimaryAction);
  elements.secondaryButton.addEventListener('click', close);
  elements.closeButton.addEventListener('click', close);
  elements.tree.addEventListener('dragover', (event) => {
    if (!state.draggedKey || state.editor) {
      return;
    }

    event.preventDefault();
  });

  elements.tree.addEventListener('click', (event) => {
    if (!event.target.closest('.manage-tree-row') && !state.editor) {
      setSelection(null);
      renderTree();
    }
  });

  if (elements.createTemplateButton) {
    elements.createTemplateButton.addEventListener('click', startCreateTemplateInline);
  }

  elements.overlay.addEventListener('click', (event) => {
    if (event.target === elements.overlay) {
      close();
    }
  });

  document.addEventListener('click', (event) => {
    if (!elements.contextMenu.contains(event.target)) {
      hideContextMenu();
    }
  });

  return {
    open,
    close,
    render,
    handleEnterKey,
  };
}
