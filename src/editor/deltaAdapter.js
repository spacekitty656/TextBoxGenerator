import { extractDocumentFromDelta as extractDocumentFromDeltaFromQuill } from './quillAdapter.js';

export function createDeltaAdapter() {
  function extractDocumentFromDelta(delta) {
    return extractDocumentFromDeltaFromQuill(delta);
  }

  return {
    extractDocumentFromDelta,
  };
}
