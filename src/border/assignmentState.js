export function createBorderAssignmentState() {
  return {
    assignments: {},
    brokenReferences: {},
  };
}

function ensurePiece(state, pieceId) {
  if (!state.assignments[pieceId]) {
    state.assignments[pieceId] = {
      imageId: null,
      transform: {
        rotation: 0,
        flipX: false,
        flipY: false,
      },
    };
  }

  return state.assignments[pieceId];
}

export function borderAssignmentReducer(currentState, action) {
  const state = {
    assignments: structuredClone(currentState.assignments),
    brokenReferences: structuredClone(currentState.brokenReferences),
  };

  switch (action.type) {
    case 'ASSIGN_PIECE': {
      const piece = ensurePiece(state, action.pieceId);
      piece.imageId = action.imageId;
      delete state.brokenReferences[action.pieceId];
      return state;
    }
    case 'CLEAR_PIECE': {
      const piece = ensurePiece(state, action.pieceId);
      piece.imageId = null;
      delete state.brokenReferences[action.pieceId];
      return state;
    }
    case 'UPDATE_TRANSFORM': {
      const piece = ensurePiece(state, action.pieceId);
      piece.transform = {
        ...piece.transform,
        ...action.transform,
      };
      return state;
    }
    case 'RECONCILE_REFERENCES': {
      const validIds = new Set(action.validImageIds || []);
      for (const [pieceId, assignment] of Object.entries(state.assignments)) {
        if (assignment.imageId && !validIds.has(assignment.imageId)) {
          state.brokenReferences[pieceId] = assignment.imageId;
        } else {
          delete state.brokenReferences[pieceId];
        }
      }
      return state;
    }
    default:
      return state;
  }
}
