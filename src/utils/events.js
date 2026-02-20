export function createEventRegistry() {
  const disposers = [];

  function on(target, type, listener, options) {
    if (!target || typeof target.addEventListener !== 'function') {
      return () => {};
    }

    target.addEventListener(type, listener, options);
    const dispose = () => {
      target.removeEventListener(type, listener, options);
    };

    disposers.push(dispose);
    return dispose;
  }

  function clear() {
    while (disposers.length > 0) {
      const dispose = disposers.pop();
      dispose();
    }
  }

  return { on, clear };
}
