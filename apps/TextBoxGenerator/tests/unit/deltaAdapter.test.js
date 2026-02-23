import { describe, expect, it } from 'vitest';

import { createDeltaAdapter } from '../../src/editor/deltaAdapter.js';

describe('createDeltaAdapter', () => {
  it('delegates delta extraction through a narrow adapter API', () => {
    const adapter = createDeltaAdapter();
    const lines = adapter.extractDocumentFromDelta({
      ops: [
        { insert: 'Hello', attributes: { bold: true } },
        { insert: '\n', attributes: { align: 'center' } },
      ],
    });

    expect(lines).toEqual([
      {
        runs: [{ text: 'Hello', attributes: { bold: true } }],
        align: 'center',
      },
    ]);
  });
});
