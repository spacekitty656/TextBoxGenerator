export function createImageBorderSlotState() {
  return {
    imageId: null,
    rotation: 0,
    flipX: false,
    flipY: false,
  };
}

export function clearImageBorderSlot(slotState) {
  if (!slotState) {
    return false;
  }

  slotState.imageId = null;
  return true;
}

export function assignImageBorderSlot({ imageBorderState, slotType, slotName, getImageById, imageId }) {
  const slotState = imageBorderState?.[slotType]?.[slotName];

  if (!slotState) {
    return false;
  }

  const selectedImage = imageId ? getImageById?.(imageId) : null;
  slotState.imageId = selectedImage?.id || null;
  return true;
}

export function clearDeletedImageBorderReferences(imageBorderState, imageIds = []) {
  const ids = new Set(imageIds);
  if (!ids.size) {
    return;
  }

  ['corners', 'sides'].forEach((slotType) => {
    Object.values(imageBorderState?.[slotType] || {}).forEach((slotState) => {
      if (slotState?.imageId && ids.has(slotState.imageId)) {
        clearImageBorderSlot(slotState);
      }
    });
  });
}

export function resolveRenderableImageBorderSlot(slotState, getImageById) {
  const imageEntry = slotState?.imageId ? getImageById?.(slotState.imageId) : null;

  if (imageEntry?.image) {
    return {
      ...slotState,
      image: imageEntry.image,
      status: 'ready',
      brokenReference: false,
    };
  }

  if (slotState?.imageId) {
    return {
      ...slotState,
      image: null,
      status: 'broken',
      brokenReference: true,
    };
  }

  return {
    ...slotState,
    image: null,
    status: 'empty',
    brokenReference: false,
  };
}

export function resolveRenderableImageBorderGroup(slotGroup, getImageById) {
  return Object.fromEntries(
    Object.entries(slotGroup).map(([slotName, slotState]) => [
      slotName,
      resolveRenderableImageBorderSlot(slotState, getImageById),
    ]),
  );
}
