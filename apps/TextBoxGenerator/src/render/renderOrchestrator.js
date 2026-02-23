export function createRenderOrchestrator({
  quill,
  getBorderConfig,
  getCanvasBackgroundConfig,
  getCanvasSizePaddingConfig,
  painter,
  canvas,
  context,
  updateEditorBackgroundColor,
  isTextWrapEnabled,
  maxImageWidthInput,
  baseCanvasContentWidth,
  clampToPositiveNumber,
  renderer,
  editor,
}) {
  function extractDocumentFromDelta(delta) {
    return editor.extractDocumentFromDelta(delta);
  }

  function layoutDocumentForCanvas(lines, maxWidth, wrapEnabled) {
    return renderer.layoutDocumentForCanvas(lines, maxWidth, wrapEnabled);
  }

  function calculateCanvasDimensions(laidOutLines, borderConfig, canvasSizePaddingConfig, maxContentWidth) {
    return renderer.calculateCanvasDimensions(laidOutLines, borderConfig, canvasSizePaddingConfig, maxContentWidth);
  }

  function render() {
    const borderConfig = getBorderConfig();
    const canvasBackgroundConfig = getCanvasBackgroundConfig();

    if (updateEditorBackgroundColor) {
      updateEditorBackgroundColor(borderConfig, canvasBackgroundConfig);
    }

    const canvasSizePaddingConfig = getCanvasSizePaddingConfig();
    const configuredBaseWidth = clampToPositiveNumber(maxImageWidthInput?.value, baseCanvasContentWidth);
    const maxContentWidth = Math.max(
      50,
      configuredBaseWidth
        - canvasSizePaddingConfig.left
        - canvasSizePaddingConfig.right
        - (borderConfig.enabled ? borderConfig.width * 2 + borderConfig.padding.left + borderConfig.padding.right : 0),
    );

    const delta = quill.getContents();
    const lines = extractDocumentFromDelta(delta);
    const laidOutLines = layoutDocumentForCanvas(lines, maxContentWidth, isTextWrapEnabled());
    const measuredCanvasDimensions = calculateCanvasDimensions(
      laidOutLines,
      borderConfig,
      canvasSizePaddingConfig,
      maxContentWidth,
    );

    canvas.width = measuredCanvasDimensions.width;
    canvas.height = measuredCanvasDimensions.height;

    painter.paintDocument({
      context,
      canvas,
      laidOutLines,
      borderConfig,
      canvasBackgroundConfig,
      canvasSizePaddingConfig,
      maxContentWidth,
    });
  }

  return {
    render,
    extractDocumentFromDelta,
    layoutDocumentForCanvas,
    calculateCanvasDimensions,
  };
}
