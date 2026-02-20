import { describe, expect, it } from 'vitest';

import { borderAssignmentReducer, createBorderAssignmentState } from '../../src/border/assignmentState.js';

describe('border assignment state', () => {
  it('tracks transform metadata and clears broken refs after reassignment', () => {
    let state = createBorderAssignmentState();

    state = borderAssignmentReducer(state, {
      type: 'ASSIGN_PIECE',
      pieceId: 'top-left',
      imageId: 'img-a',
    });

    state = borderAssignmentReducer(state, {
      type: 'UPDATE_TRANSFORM',
      pieceId: 'top-left',
      transform: { rotation: 90, flipX: true },
    });

    state = borderAssignmentReducer(state, {
      type: 'RECONCILE_REFERENCES',
      validImageIds: ['img-b'],
    });

    expect(state.brokenReferences['top-left']).toBe('img-a');
    expect(state.assignments['top-left'].transform).toEqual({
      rotation: 90,
      flipX: true,
      flipY: false,
    });

    state = borderAssignmentReducer(state, {
      type: 'ASSIGN_PIECE',
      pieceId: 'top-left',
      imageId: 'img-b',
    });

    expect(state.brokenReferences['top-left']).toBeUndefined();
  });

  it('supports clear-piece semantics', () => {
    let state = createBorderAssignmentState();
    state = borderAssignmentReducer(state, { type: 'ASSIGN_PIECE', pieceId: 'right', imageId: 'img-c' });

    state = borderAssignmentReducer(state, { type: 'CLEAR_PIECE', pieceId: 'right' });

    expect(state.assignments.right.imageId).toBeNull();
  });
});
