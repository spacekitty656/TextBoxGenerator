function normalizeNode(node) {
  const base = {
    id: String(node.id),
    type: node.type,
    name: String(node.name || ''),
  };

  if (node.type === 'folder') {
    base.children = Array.isArray(node.children) ? node.children.map(normalizeNode) : [];
  }

  if (node.type === 'image') {
    base.assetId = node.assetId || null;
  }

  return base;
}

export function serializeLibraryState(state) {
  return JSON.stringify(normalizeNode(state));
}

export function deserializeLibraryState(serialized) {
  const parsed = JSON.parse(serialized);
  return normalizeNode(parsed);
}
