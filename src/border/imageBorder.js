export function getImageBorderSlotState(imageBorderState, slotType, slotName) {
  const group = imageBorderState[slotType];
  return group ? group[slotName] : null;
}

export function hasReadyImage(slot) {
  return Boolean(slot && slot.status === 'ready' && slot.image);
}

export function getSlotImageSize(slot) {
  if (!hasReadyImage(slot)) {
    return { width: 0, height: 0 };
  }

  const width = slot.image.width || slot.image.naturalWidth || 0;
  const height = slot.image.height || slot.image.naturalHeight || 0;
  return { width, height };
}

export function drawSideImage({ context, slot, x, y, width, height, orientation, sideMode }) {
  if (!hasReadyImage(slot) || width <= 0 || height <= 0) {
    return false;
  }

  const sourceImage = slot.image;

  if (sideMode === 'repeat') {
    const sourceSize = getSlotImageSize(slot);
    const tileLength = orientation === 'horizontal'
      ? Math.max(1, sourceSize.width || sourceSize.height || width)
      : Math.max(1, sourceSize.height || sourceSize.width || height);

    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();

    if (orientation === 'horizontal') {
      let drawX = x;
      const maxX = x + width;
      while (drawX < maxX) {
        drawTransformedImage({ context, slot, sourceImage, x: drawX, y, width: tileLength, height });
        drawX += tileLength;
      }
    } else {
      let drawY = y;
      const maxY = y + height;
      while (drawY < maxY) {
        drawTransformedImage({ context, slot, sourceImage, x, y: drawY, width, height: tileLength });
        drawY += tileLength;
      }
    }

    context.restore();

    return true;
  }

  drawTransformedImage({ context, slot, sourceImage, x, y, width, height });
  return true;
}

function drawTransformedImage({ context, slot, sourceImage, x, y, width, height }) {
  const rotation = Number.parseInt(slot?.rotation, 10) || 0;
  const flipX = Boolean(slot?.flipX);
  const flipY = Boolean(slot?.flipY);

  if (rotation === 0 && !flipX && !flipY) {
    context.drawImage(sourceImage, x, y, width, height);
    return;
  }

  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  context.drawImage(sourceImage, -width / 2, -height / 2, width, height);
  context.restore();
}

export function drawImageBorder({ context, borderConfig, borderX, borderY, borderRectWidth, borderRectHeight, drawRoundedRectPath }) {
  const fallbackColor = borderConfig.color;
  const { sizingStrategy, sideMode, corners, sides } = borderConfig.imageBorder;

  context.save();
  drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
  context.clip();

  const defaultCornerSize = Math.max(1, borderConfig.width);
  const resolveCornerDrawSize = (slot, slotSize) => {
    if (!hasReadyImage(slot) || sizingStrategy === 'fixed') {
      return { width: defaultCornerSize, height: defaultCornerSize };
    }

    const targetHeight = Math.max(1, borderConfig.width);
    const safeSourceHeight = Math.max(1, slotSize.height || targetHeight);
    const scaledWidth = Math.max(1, Math.round((slotSize.width || targetHeight) * (targetHeight / safeSourceHeight)));
    return { width: scaledWidth, height: targetHeight };
  };

  const topLeft = corners?.topLeft;
  const topRight = corners?.topRight;
  const bottomRight = corners?.bottomRight;
  const bottomLeft = corners?.bottomLeft;

  const topLeftSize = resolveCornerDrawSize(topLeft, getSlotImageSize(topLeft));
  const topRightSize = resolveCornerDrawSize(topRight, getSlotImageSize(topRight));
  const bottomRightSize = resolveCornerDrawSize(bottomRight, getSlotImageSize(bottomRight));
  const bottomLeftSize = resolveCornerDrawSize(bottomLeft, getSlotImageSize(bottomLeft));

  if (hasReadyImage(topLeft)) drawTransformedImage({ context, slot: topLeft, sourceImage: topLeft.image, x: borderX, y: borderY, width: topLeftSize.width, height: topLeftSize.height });
  if (hasReadyImage(topRight)) drawTransformedImage({ context, slot: topRight, sourceImage: topRight.image, x: borderX + borderRectWidth - topRightSize.width, y: borderY, width: topRightSize.width, height: topRightSize.height });
  if (hasReadyImage(bottomRight)) drawTransformedImage({ context, slot: bottomRight, sourceImage: bottomRight.image, x: borderX + borderRectWidth - bottomRightSize.width, y: borderY + borderRectHeight - bottomRightSize.height, width: bottomRightSize.width, height: bottomRightSize.height });
  if (hasReadyImage(bottomLeft)) drawTransformedImage({ context, slot: bottomLeft, sourceImage: bottomLeft.image, x: borderX, y: borderY + borderRectHeight - bottomLeftSize.height, width: bottomLeftSize.width, height: bottomLeftSize.height });

  const topSideX = borderX + topLeftSize.width;
  const topSideWidth = Math.max(0, borderRectWidth - topLeftSize.width - topRightSize.width);
  const topSideHeight = Math.max(1, Math.max(topLeftSize.height, topRightSize.height, borderConfig.width));

  const bottomSideX = borderX + bottomLeftSize.width;
  const bottomSideWidth = Math.max(0, borderRectWidth - bottomLeftSize.width - bottomRightSize.width);
  const bottomSideHeight = Math.max(1, Math.max(bottomLeftSize.height, bottomRightSize.height, borderConfig.width));

  const leftSideY = borderY + topLeftSize.height;
  const leftSideHeight = Math.max(0, borderRectHeight - topLeftSize.height - bottomLeftSize.height);
  const leftSideWidth = Math.max(1, Math.max(topLeftSize.width, bottomLeftSize.width, borderConfig.width));

  const rightSideY = borderY + topRightSize.height;
  const rightSideHeight = Math.max(0, borderRectHeight - topRightSize.height - bottomRightSize.height);
  const rightSideWidth = Math.max(1, Math.max(topRightSize.width, bottomRightSize.width, borderConfig.width));

  drawSideImage({ context, slot: sides?.top, x: topSideX, y: borderY, width: topSideWidth, height: topSideHeight, orientation: 'horizontal', sideMode });
  drawSideImage({ context, slot: sides?.bottom, x: bottomSideX, y: borderY + borderRectHeight - bottomSideHeight, width: bottomSideWidth, height: bottomSideHeight, orientation: 'horizontal', sideMode });
  drawSideImage({ context, slot: sides?.left, x: borderX, y: leftSideY, width: leftSideWidth, height: leftSideHeight, orientation: 'vertical', sideMode });
  drawSideImage({ context, slot: sides?.right, x: borderX + borderRectWidth - rightSideWidth, y: rightSideY, width: rightSideWidth, height: rightSideHeight, orientation: 'vertical', sideMode });

  context.restore();

  const hasAnyImage = [topLeft, topRight, bottomRight, bottomLeft, sides?.top, sides?.right, sides?.bottom, sides?.left].some(hasReadyImage);

  if (!hasAnyImage) {
    context.save();
    context.lineWidth = borderConfig.width;
    context.strokeStyle = fallbackColor;
    drawRoundedRectPath(borderX, borderY, borderRectWidth, borderRectHeight, borderConfig.radius);
    context.stroke();
    context.restore();
  }
}
