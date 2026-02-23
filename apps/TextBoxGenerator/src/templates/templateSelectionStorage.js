export const SELECTED_TEMPLATE_STORAGE_KEY = 'textbox-generator:selected-template-id';

export function persistSelectedTemplateIdentifier(templateId, {
  storage = window.localStorage,
  storageKey = SELECTED_TEMPLATE_STORAGE_KEY,
} = {}) {
  if (!storage || typeof storage.setItem !== 'function') {
    return;
  }

  if (!templateId) {
    storage.removeItem(storageKey);
    return;
  }

  storage.setItem(storageKey, templateId);
}

export function readSelectedTemplateIdentifier({
  storage = window.localStorage,
  storageKey = SELECTED_TEMPLATE_STORAGE_KEY,
} = {}) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  const value = storage.getItem(storageKey);
  return typeof value === 'string' && value.trim() ? value : null;
}
