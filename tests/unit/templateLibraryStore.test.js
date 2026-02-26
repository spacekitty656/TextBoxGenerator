import { describe, expect, it } from 'vitest';

import { createTemplateLibraryStore, DEFAULT_BORDER_TEMPLATE_ID } from '../../src/border/templateLibraryStore.js';

describe('createTemplateLibraryStore', () => {
  it('includes border padding rounding defaults in the default template data', () => {
    const store = createTemplateLibraryStore();
    const defaultTemplate = store.getTemplate(DEFAULT_BORDER_TEMPLATE_ID);

    expect(defaultTemplate?.data?.paddingRounding).toEqual({
      horizontal: 'none',
      vertical: 'none',
    });
  });
});
