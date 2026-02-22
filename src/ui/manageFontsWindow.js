function getEntityKey(entry) {
  return entry ? `${entry.type}:${entry.id}` : '';
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const NEW_ROW_KEY = '__new-font-folder__';

export function createManageFontsWindowController({
  store,
  elements,
  importFontFromFile,
  onFontsChanged,
}) {
  const state = {
    isOpen: false,
    selectedKey: null,
    collapsedFolderIds: new Set(),
    editor: null,
  };

  function listEntities(parentId) {
    const children = store.listChildren(parentId, { templateClass: 'font' });
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
    }

    const root = store.getRootFolder();
    if (root) {
      walk(root, 0);
    }

    return rows;
  }

  function syncToolbarState() {
    const selected = getEntityByKey(state.selectedKey);
    const isRoot = selected?.type === 'folder' && selected.id === store.ROOT_FOLDER_ID;
    const immutable = Boolean(selected?.immutable);

    elements.actions.renameButton.disabled = !selected || isRoot || immutable || Boolean(state.editor);
    elements.actions.deleteButton.disabled = !selected || isRoot || immutable || Boolean(state.editor);
    elements.actions.createFolderButton.disabled = Boolean(state.editor);
    elements.actions.importButton.disabled = Boolean(state.editor);
  }

  function setSelection(key) {
    state.selectedKey = getEntityByKey(key) ? key : null;
    syncToolbarState();
  }

  function getPreferredParentId() {
    const selected = getEntityByKey(state.selectedKey);
    if (!selected) {
      return store.ROOT_FOLDER_ID;
    }

    return selected.type === 'folder' ? selected.id : selected.parentId;
  }

  function startCreateFolderInline() {
    const parentId = getPreferredParentId();
    state.collapsedFolderIds.delete(parentId);
    state.editor = {
      mode: 'create-folder',
      parentId,
      draftName: 'Untitled Folder',
    };
    render();
  }

  function startRenameInline() {
    const selected = getEntityByKey(state.selectedKey);
    if (!selected || selected.id === store.ROOT_FOLDER_ID || selected.immutable) {
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
      const created = store.createFolder({
        name: nextName,
        parentId: state.editor.parentId,
      });

      state.editor = null;
      setSelection(getEntityKey(created));
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
    onFontsChanged?.();
    render();
  }

  function requestDelete() {
    const selected = getEntityByKey(state.selectedKey);
    if (!selected || selected.id === store.ROOT_FOLDER_ID || selected.immutable) {
      return;
    }

    if (selected.type === 'folder') {
      store.deleteFolder(selected.id);
    } else {
      store.deleteTemplate(selected.id);
    }

    setSelection(null);
    onFontsChanged?.();
    render();
  }

  async function importFonts(files) {
    const fileList = Array.from(files || []);
    if (!fileList.length) {
      return;
    }

    const targetParentId = getPreferredParentId();
    let lastImportedKey = null;

    for (const file of fileList) {
      const imported = await importFontFromFile(file);
      if (!imported) {
        continue;
      }

      const created = store.createTemplate({
        name: imported.name,
        parentId: targetParentId,
        templateClass: 'font',
        data: {
          value: imported.value,
          family: imported.family,
        },
      });
      lastImportedKey = getEntityKey(created);
    }

    if (lastImportedKey) {
      setSelection(lastImportedKey);
      onFontsChanged?.();
      render();
    }
  }

  function renderTree() {
    elements.tree.tree.innerHTML = '';

    getVisibleRows().forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'manage-tree-row';
      row.dataset.entityKey = entry.key;
      row.style.paddingLeft = `${entry.depth * 20 + 8}px`;

      if (state.selectedKey === entry.key) {
        row.classList.add('active');
      }

      const hasChildren = entry.type === 'folder'
        && !entry.synthetic
        && (store.listChildren(entry.id, { templateClass: 'font' }).folders.length
          + store.listChildren(entry.id, { templateClass: 'font' }).templates.length) > 0;

      const isCollapsed = state.collapsedFolderIds.has(entry.id);
      const toggleMarkup = entry.type === 'folder'
        ? `<button type="button" class="manage-tree-toggle" aria-label="${isCollapsed ? 'Expand' : 'Collapse'} folder">${hasChildren ? (isCollapsed ? '▸' : '▾') : ''}</button>`
        : '<span class="manage-tree-toggle-spacer" aria-hidden="true"></span>';

      const iconMarkup = entry.type === 'folder'
        ? '<span class="manage-tree-icon">📁</span>'
        : '<span class="manage-tree-icon"><img class="font-tree-icon" src="assets/icons/file-font-svgrepo-com.svg" alt="" aria-hidden="true" /></span>';

      const nameMarkup = state.editor
        && ((state.editor.mode === 'rename' && state.editor.key === entry.key)
          || (state.editor.mode === 'create-folder' && entry.synthetic))
        ? `<input type="text" class="manage-tree-rename-input" value="${escapeHtml(state.editor.draftName)}" />`
        : `<span class="manage-tree-name">${escapeHtml(entry.name)}</span>`;

      row.innerHTML = `${toggleMarkup}${iconMarkup}${nameMarkup}`;

      row.addEventListener('click', (event) => {
        if (event.target.closest('.manage-tree-toggle') && entry.type === 'folder') {
          if (state.collapsedFolderIds.has(entry.id)) {
            state.collapsedFolderIds.delete(entry.id);
          } else if (hasChildren) {
            state.collapsedFolderIds.add(entry.id);
          }
          renderTree();
          return;
        }

        if (!state.editor || entry.synthetic) {
          setSelection(entry.key);
          renderTree();
        }
      });

      if (state.editor
        && ((state.editor.mode === 'rename' && state.editor.key === entry.key)
          || (state.editor.mode === 'create-folder' && entry.synthetic))) {
        const renameInput = row.querySelector('.manage-tree-rename-input');
        renameInput?.focus();
        renameInput?.select();
        renameInput?.addEventListener('input', () => {
          if (state.editor) {
            state.editor.draftName = renameInput.value;
          }
        });
        renameInput?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitInlineEdit(renameInput.value);
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            state.editor = null;
            render();
          }
        });
        renameInput?.addEventListener('blur', () => {
          if (state.editor) {
            commitInlineEdit(renameInput.value);
          }
        });
      }

      elements.tree.tree.appendChild(row);
    });

    syncToolbarState();
  }

  function render() {
    renderTree();
    syncToolbarState();
  }

  function open() {
    state.isOpen = true;
    elements.window.overlay.classList.remove('hidden');
    elements.window.overlay.setAttribute('aria-hidden', 'false');
    render();
  }

  function close() {
    state.isOpen = false;
    state.editor = null;
    elements.window.overlay.classList.add('hidden');
    elements.window.overlay.setAttribute('aria-hidden', 'true');
  }

  elements.actions.importButton.addEventListener('click', () => {
    if (!state.editor) {
      elements.tree.input.click();
    }
  });
  elements.actions.createFolderButton.addEventListener('click', startCreateFolderInline);
  elements.actions.renameButton.addEventListener('click', startRenameInline);
  elements.actions.deleteButton.addEventListener('click', requestDelete);

  elements.tree.input.addEventListener('change', async () => {
    await importFonts(elements.tree.input.files);
    elements.tree.input.value = '';
  });

  elements.window.openButton.addEventListener('click', open);
  elements.window.closeButton.addEventListener('click', close);
  elements.window.cancelButton.addEventListener('click', close);
  elements.window.overlay.addEventListener('click', (event) => {
    if (event.target === elements.window.overlay) {
      close();
    }
  });

  return {
    open,
    close,
  };
}
