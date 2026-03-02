const DB_NAME = 'textbox-generator-editor-template-library';
const DB_VERSION = 1;
const TEMPLATE_STORE = 'templates';
const TEMPLATE_RECORD_ID = 'editor-template';
const TEMPLATE_NAME = 'editor template';

const PERSISTENCE_ERROR_REASONS = {
  QUOTA_EXCEEDED: 'quota-exceeded',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
};

function createSuccessStatus() {
  return { ok: true };
}

function createFailureStatus(reason, error) {
  return { ok: false, reason, error };
}

function isQuotaExceededError(error) {
  if (!error) {
    return false;
  }

  const name = String(error.name || '');
  const code = Number(error.code);

  return name === 'QuotaExceededError'
    || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || code === 22
    || code === 1014;
}

function toPersistenceErrorReason(error) {
  if (isQuotaExceededError(error)) {
    return PERSISTENCE_ERROR_REASONS.QUOTA_EXCEEDED;
  }

  if (error?.name === 'InvalidStateError' || error?.name === 'NotSupportedError') {
    return PERSISTENCE_ERROR_REASONS.UNAVAILABLE;
  }

  return PERSISTENCE_ERROR_REASONS.UNKNOWN;
}

function openDatabase(indexedDb = window.indexedDB) {
  if (!indexedDb || typeof indexedDb.open !== 'function') {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(TEMPLATE_STORE)) {
        database.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open IndexedDB.'));
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
  });
}

export async function persistEditorTemplateToIndexedDb(templateData, { indexedDb = window.indexedDB } = {}) {
  if (!templateData || typeof templateData !== 'object') {
    return createFailureStatus(PERSISTENCE_ERROR_REASONS.UNAVAILABLE, null);
  }

  let database = null;

  try {
    database = await openDatabase(indexedDb);
    if (!database) {
      return createFailureStatus(PERSISTENCE_ERROR_REASONS.UNAVAILABLE, null);
    }

    const transaction = database.transaction([TEMPLATE_STORE], 'readwrite');
    const templateStore = transaction.objectStore(TEMPLATE_STORE);

    templateStore.put({
      id: TEMPLATE_RECORD_ID,
      name: TEMPLATE_NAME,
      data: templateData,
      updatedAt: Date.now(),
    });

    await transactionDone(transaction);
    return createSuccessStatus();
  } catch (error) {
    return createFailureStatus(toPersistenceErrorReason(error), error);
  } finally {
    database?.close();
  }
}

export async function restoreEditorTemplateFromIndexedDb({ indexedDb = window.indexedDB } = {}) {
  const database = await openDatabase(indexedDb);

  if (!database) {
    return null;
  }

  try {
    const transaction = database.transaction([TEMPLATE_STORE], 'readonly');
    const templateStore = transaction.objectStore(TEMPLATE_STORE);
    const templateRecord = await requestToPromise(templateStore.get(TEMPLATE_RECORD_ID));

    return templateRecord?.data || null;
  } finally {
    database.close();
  }
}

export const editorTemplateIndexedDbConfig = {
  databaseName: DB_NAME,
  version: DB_VERSION,
  stores: {
    templates: TEMPLATE_STORE,
  },
  template: {
    id: TEMPLATE_RECORD_ID,
    name: TEMPLATE_NAME,
  },
};
