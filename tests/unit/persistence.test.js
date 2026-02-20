import { describe, expect, it } from 'vitest';

import { serializeLibraryState, deserializeLibraryState } from '../../src/images/persistence.js';

describe('library persistence', () => {
  it('preserves structure through serialize/deserialize round-trip', () => {
    const state = {
      id: 'root',
      type: 'folder',
      name: 'Root',
      children: [
        {
          id: 'folder-1',
          type: 'folder',
          name: 'Folder 1',
          children: [
            {
              id: 'image-1',
              type: 'image',
              name: 'Image 1',
              assetId: 'asset-1',
            },
          ],
        },
      ],
    };

    const serialized = serializeLibraryState(state);
    const restored = deserializeLibraryState(serialized);

    expect(restored).toEqual(state);
  });
});
