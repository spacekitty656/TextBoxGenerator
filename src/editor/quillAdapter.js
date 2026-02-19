export function createQuillEditor(Quill, handlers) {
  return new Quill('#editor', {
    theme: 'snow',
    modules: {
      toolbar: {
        container: '#editor-toolbar',
        handlers,
      },
    },
    placeholder: 'Type formatted text here...',
  });
}

export function extractDocumentFromDelta(delta) {
  const lines = [];
  let currentRuns = [];

  delta.ops.forEach((op) => {
    if (typeof op.insert !== 'string') {
      return;
    }

    const chunks = op.insert.split('\n');

    chunks.forEach((chunk, index) => {
      if (chunk.length > 0) {
        currentRuns.push({
          text: chunk,
          attributes: op.attributes || {},
        });
      }

      if (index < chunks.length - 1) {
        lines.push({ runs: currentRuns, align: op.attributes?.align || 'left' });
        currentRuns = [];
      }
    });
  });

  if (currentRuns.length > 0) {
    lines.push({ runs: currentRuns, align: 'left' });
  }

  if (lines.length === 0) {
    lines.push({ runs: [{ text: '', attributes: {} }], align: 'left' });
  }

  return lines;
}
