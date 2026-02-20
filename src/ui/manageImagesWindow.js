const DEFAULT_ROOT_ID = 'all-images';

function asSet(values) {
  return new Set(Array.isArray(values) ? values : []);
}

function getNodePath(nodeId, nodes) {
  const path = [];
  let cursorId = nodeId;

  while (cursorId) {
    const node = nodes.get(cursorId);
    if (!node) {
      break;
    }

    path.push(cursorId);
    cursorId = node.parentId || null;
  }

  return path;
}

export function createManageImagesWindowController(options = {}) {
  return new ManageImagesWindowController(options);
}

export class ManageImagesWindowController {
  constructor({
    treePane,
    treeRoot,
    toolbar = {},
    contextMenus = {},
    onImportImage = () => {},
    onCreateFolder = () => {},
    onRefresh = () => {},
    onRename = () => {},
    onDelete = () => {},
    onMove = () => {},
    onFolderToggle = () => {},
    onContextAction = () => {},
  } = {}) {
    this.treePane = treePane || null;
    this.treeRoot = treeRoot || null;
    this.toolbar = toolbar;
    this.contextMenus = contextMenus;

    this.callbacks = {
      onImportImage,
      onCreateFolder,
      onRefresh,
      onRename,
      onDelete,
      onMove,
      onFolderToggle,
      onContextAction,
    };

    this.nodes = new Map();
    this.rootId = DEFAULT_ROOT_ID;
    this.selectedIds = new Set();
    this.selectionAnchorId = null;
    this.draggedNodeId = null;

    this.handleTreeClick = this.handleTreeClick.bind(this);
    this.handleTreeContextMenu = this.handleTreeContextMenu.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);

    this.initialize();
  }

  initialize() {
    if (this.treePane) {
      this.treePane.style.overflowY = 'auto';
      this.treePane.style.overflowX = 'hidden';
    }

    this.bindToolbarActions();
    this.bindTreeEvents();
    this.bindContextMenuActions();
    this.syncToolbarState();
  }

  bindToolbarActions() {
    this.toolbar.importImage?.addEventListener('click', () => this.callbacks.onImportImage());
    this.toolbar.createFolder?.addEventListener('click', () => this.callbacks.onCreateFolder(asSet(this.selectedIds)));
    this.toolbar.refresh?.addEventListener('click', () => this.refreshSelection());
    this.toolbar.rename?.addEventListener('click', () => this.renameSelection());
    this.toolbar.delete?.addEventListener('click', () => this.deleteSelection());
  }

  bindTreeEvents() {
    if (!this.treeRoot) {
      return;
    }

    this.treeRoot.addEventListener('click', this.handleTreeClick);
    this.treeRoot.addEventListener('contextmenu', this.handleTreeContextMenu);
    this.treeRoot.addEventListener('dragstart', this.handleDragStart);
    this.treeRoot.addEventListener('dragover', this.handleDragOver);
    this.treeRoot.addEventListener('drop', this.handleDrop);
  }

  bindContextMenuActions() {
    [this.contextMenus.image, this.contextMenus.folder].forEach((menu) => {
      if (!menu) {
        return;
      }

      menu.addEventListener('click', (event) => {
        const action = event.target.closest('[data-action]')?.dataset?.action;
        if (!action) {
          return;
        }

        this.callbacks.onContextAction(action, asSet(this.selectedIds));
        if (action === 'refresh') {
          this.refreshSelection();
        } else if (action === 'rename') {
          this.renameSelection();
        } else if (action === 'delete') {
          this.deleteSelection();
        }

        this.hideContextMenus();
      });
    });
  }

  setTreeData({ nodes = [], rootId = DEFAULT_ROOT_ID } = {}) {
    this.rootId = rootId;
    this.nodes = new Map(nodes.map((node) => [node.id, { ...node }]));

    if (!this.nodes.has(rootId)) {
      this.nodes.set(rootId, {
        id: rootId,
        type: 'folder',
        expanded: true,
        childrenIds: [],
      });
    }

    this.selectedIds = new Set([...this.selectedIds].filter((nodeId) => this.nodes.has(nodeId)));
    this.syncToolbarState();
  }

  getVisibleNodeIds() {
    const ordered = [];
    const visit = (nodeId) => {
      const node = this.nodes.get(nodeId);
      if (!node) {
        return;
      }

      ordered.push(nodeId);
      if (node.type !== 'folder' || node.expanded === false) {
        return;
      }

      (node.childrenIds || []).forEach(visit);
    };

    visit(this.rootId);
    return ordered;
  }

  handleTreeClick(event) {
    const row = event.target.closest('[data-node-id]');
    if (!row) {
      return;
    }

    const nodeId = row.dataset.nodeId;
    const node = this.nodes.get(nodeId);
    if (!node) {
      return;
    }

    const toggle = event.target.closest('[data-role="tree-toggle"]');
    if (toggle && node.type === 'folder') {
      node.expanded = !node.expanded;
      this.callbacks.onFolderToggle(nodeId, node.expanded);
      return;
    }

    this.updateSelectionFromEvent(nodeId, event);
  }

  handleTreeContextMenu(event) {
    const row = event.target.closest('[data-node-id]');
    if (!row) {
      return;
    }

    event.preventDefault();
    const nodeId = row.dataset.nodeId;
    const node = this.nodes.get(nodeId);
    if (!node) {
      return;
    }

    if (!this.selectedIds.has(nodeId)) {
      this.selectedIds = new Set([nodeId]);
      this.selectionAnchorId = nodeId;
      this.syncToolbarState();
    }

    this.showContextMenu(node.type, event.clientX, event.clientY);
  }

  updateSelectionFromEvent(nodeId, event = {}) {
    const orderedIds = this.getVisibleNodeIds();

    if (event.shiftKey && this.selectionAnchorId && orderedIds.includes(this.selectionAnchorId)) {
      const startIndex = orderedIds.indexOf(this.selectionAnchorId);
      const endIndex = orderedIds.indexOf(nodeId);
      const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      this.selectedIds = new Set(orderedIds.slice(start, end + 1));
    } else if (event.ctrlKey || event.metaKey) {
      if (this.selectedIds.has(nodeId)) {
        this.selectedIds.delete(nodeId);
      } else {
        this.selectedIds.add(nodeId);
      }
      this.selectionAnchorId = nodeId;
    } else {
      this.selectedIds = new Set([nodeId]);
      this.selectionAnchorId = nodeId;
    }

    this.syncToolbarState();
  }

  syncToolbarState() {
    const selectedNodes = [...this.selectedIds].map((nodeId) => this.nodes.get(nodeId)).filter(Boolean);
    const singleSelection = selectedNodes.length === 1;
    const singleNode = singleSelection ? selectedNodes[0] : null;

    if (this.toolbar.rename) {
      this.toolbar.rename.disabled = !singleSelection;
    }

    if (this.toolbar.refresh) {
      this.toolbar.refresh.disabled = !singleSelection || singleNode?.type !== 'image';
    }

    if (this.toolbar.delete) {
      this.toolbar.delete.disabled = selectedNodes.length === 0;
    }
  }

  showContextMenu(nodeType, x, y) {
    this.hideContextMenus();
    const menu = nodeType === 'folder' ? this.contextMenus.folder : this.contextMenus.image;
    if (!menu) {
      return;
    }

    menu.classList.remove('hidden');
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  hideContextMenus() {
    [this.contextMenus.image, this.contextMenus.folder].forEach((menu) => {
      if (!menu) {
        return;
      }

      menu.classList.add('hidden');
    });
  }

  refreshSelection() {
    if (this.selectedIds.size !== 1) {
      return;
    }

    const selectedNode = this.nodes.get([...this.selectedIds][0]);
    if (selectedNode?.type !== 'image') {
      return;
    }

    this.callbacks.onRefresh(selectedNode.id);
  }

  renameSelection() {
    if (this.selectedIds.size !== 1) {
      return;
    }

    this.callbacks.onRename([...this.selectedIds][0]);
  }

  getDeleteDialogConfig() {
    if (this.selectedIds.size === 0) {
      return null;
    }

    const selectedNodes = [...this.selectedIds].map((nodeId) => this.nodes.get(nodeId)).filter(Boolean);
    const selectedFolder = selectedNodes.length === 1 && selectedNodes[0].type === 'folder' ? selectedNodes[0] : null;

    if (selectedFolder) {
      return {
        kind: 'folder',
        title: 'Delete Folder',
        message: `Delete "${selectedFolder.name || 'folder'}"?`,
        detail: 'Choose whether to delete descendants or move children to the parent folder.',
        options: [
          { id: 'delete-with-children', label: 'Delete Folder and Children' },
          { id: 'move-children-to-parent', label: 'Delete Folder and move Children to Parent' },
          { id: 'cancel', label: 'Cancel' },
        ],
      };
    }

    return {
      kind: 'image',
      title: 'Delete Image',
      message: 'Deleting image files can break references in templates using those images.',
      detail: 'If this was moved on disk, use Refresh from computer to relink before deleting.',
      options: [
        { id: 'delete', label: 'Delete' },
        { id: 'cancel', label: 'Cancel' },
      ],
    };
  }

  deleteSelection(choice) {
    const dialog = this.getDeleteDialogConfig();
    if (!dialog) {
      return;
    }

    this.callbacks.onDelete({
      choice: choice || null,
      selection: asSet(this.selectedIds),
      dialog,
    });
  }

  handleDragStart(event) {
    const row = event.target.closest('[data-node-id]');
    if (!row) {
      return;
    }

    this.draggedNodeId = row.dataset.nodeId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', this.draggedNodeId);
    }
  }

  handleDragOver(event) {
    const row = event.target.closest('[data-node-id]');
    if (!row) {
      return;
    }

    if (!this.draggedNodeId) {
      return;
    }

    if (this.canDrop(this.draggedNodeId, row.dataset.nodeId)) {
      event.preventDefault();
    }
  }

  handleDrop(event) {
    const row = event.target.closest('[data-node-id]');
    if (!row || !this.draggedNodeId) {
      return;
    }

    const targetId = row.dataset.nodeId;
    if (!this.canDrop(this.draggedNodeId, targetId)) {
      this.draggedNodeId = null;
      return;
    }

    event.preventDefault();

    const targetNode = this.nodes.get(targetId);
    const mode = targetNode?.type === 'folder' ? 'move' : 'reorder';
    this.callbacks.onMove({ draggedId: this.draggedNodeId, targetId, mode });
    this.draggedNodeId = null;
  }

  canDrop(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) {
      return false;
    }

    if (draggedId === this.rootId || targetId === this.rootId) {
      return false;
    }

    if (!this.isInAllImagesSubtree(draggedId) || !this.isInAllImagesSubtree(targetId)) {
      return false;
    }

    const targetPath = getNodePath(targetId, this.nodes);
    return !targetPath.includes(draggedId);
  }

  isInAllImagesSubtree(nodeId) {
    const nodePath = getNodePath(nodeId, this.nodes);
    return nodePath.includes(this.rootId);
  }
}
