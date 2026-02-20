export function createManageImagesController({ manageImagesWindowController, callbacks }) {
  const { onRenderRequested, onStateChanged } = callbacks;
  let isMounted = false;

  function mount() {
    isMounted = true;
  }

  function unmount() {
    isMounted = false;
  }

  function open(slotType = null, slotName = null, initialImageId = null) {
    if (!isMounted) {
      return;
    }

    manageImagesWindowController.open({ slotType, slotName, initialImageId });
    onStateChanged?.();
  }

  function close() {
    if (!isMounted) {
      return;
    }

    manageImagesWindowController.close();
    onStateChanged?.();
  }

  function handleEnterKey(event) {
    return manageImagesWindowController.handleEnterKey(event);
  }

  function handleDeleteKey(event) {
    return manageImagesWindowController.handleDeleteKey(event);
  }

  function notifyRenderRequested() {
    onRenderRequested?.();
  }

  return {
    mount,
    unmount,
    open,
    close,
    handleEnterKey,
    handleDeleteKey,
    notifyRenderRequested,
  };
}
