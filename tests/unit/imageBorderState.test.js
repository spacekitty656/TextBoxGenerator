import { describe, expect, it } from 'vitest';

import {
  assignImageBorderSlot,
  clearDeletedImageBorderReferences,
  clearImageBorderSlot,
  createImageBorderSlotState,
  resolveRenderableImageBorderGroup,
  resolveRenderableImageBorderSlot,
} from '../../src/border/imageBorderState.js';

function createState() {
  return {
    corners: { topLeft: createImageBorderSlotState() },
    sides: { top: createImageBorderSlotState() },
  };
}

describe('image border state helpers', () => {
  it('assigns and clears slots while preserving transform metadata', () => {
    const state = createState();
    state.corners.topLeft.rotation = 90;
    state.corners.topLeft.flipX = true;

    assignImageBorderSlot({
      imageBorderState: state,
      slotType: 'corners',
      slotName: 'topLeft',
      getImageById: (id) => ({ id }),
      imageId: 'image-1',
    });

    expect(state.corners.topLeft).toMatchObject({
      imageId: 'image-1',
      rotation: 90,
      flipX: true,
    });

    clearImageBorderSlot(state.corners.topLeft);
    expect(state.corners.topLeft).toMatchObject({
      imageId: null,
      rotation: 90,
      flipX: true,
    });
  });

  it('marks slots with missing image ids as broken references', () => {
    const slot = { imageId: 'missing-image', rotation: 180, flipX: false, flipY: true };

    const resolved = resolveRenderableImageBorderSlot(slot, () => null);

    expect(resolved).toMatchObject({
      status: 'broken',
      brokenReference: true,
      image: null,
      rotation: 180,
      flipY: true,
    });
  });

  it('clears deleted ids from all slot groups', () => {
    const state = {
      corners: { topLeft: { ...createImageBorderSlotState(), imageId: 'image-1' } },
      sides: { top: { ...createImageBorderSlotState(), imageId: 'image-2' } },
    };

    clearDeletedImageBorderReferences(state, ['image-2']);

    expect(state.corners.topLeft.imageId).toBe('image-1');
    expect(state.sides.top.imageId).toBeNull();
  });

  it('resolves grouped renderable slot state', () => {
    const slotGroup = {
      topLeft: { ...createImageBorderSlotState(), imageId: 'image-1' },
      topRight: { ...createImageBorderSlotState(), imageId: null },
    };

    const resolved = resolveRenderableImageBorderGroup(slotGroup, (id) => (
      id === 'image-1' ? { id, image: { width: 10, height: 10 } } : null
    ));

    expect(resolved.topLeft.status).toBe('ready');
    expect(resolved.topRight.status).toBe('empty');
  });
});
