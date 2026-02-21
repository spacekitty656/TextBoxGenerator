const DB_NAME = 'textbox-generator-template-library';
const DB_VERSION = 1;
const LIBRARY_STORE = 'library';
const LIBRARY_RECORD_ID = 'snapshot';

const PERSISTENCE_ERROR_REASONS = {
  QUOTA_EXCEEDED: 'quota-exceeded',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
};

function createSuccessStatus() {
  return { ok: true };
}

function createFailureStatus(reason, error) {
  return {
    ok: false,
    reason,
    error,
  };
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

      if (!database.objectStoreNames.contains(LIBRARY_STORE)) {
        database.createObjectStore(LIBRARY_STORE, { keyPath: 'id' });
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

export async function persistTemplateLibraryToIndexedDb(store, { indexedDb = window.indexedDB } = {}) {
  if (!store || typeof store.serialize !== 'function') {
    return createFailureStatus(PERSISTENCE_ERROR_REASONS.UNAVAILABLE, null);
  }

  let database = null;

  try {
    database = await openDatabase(indexedDb);
    if (!database) {
      return createFailureStatus(PERSISTENCE_ERROR_REASONS.UNAVAILABLE, null);
    }

    const writeTransaction = database.transaction([LIBRARY_STORE], 'readwrite');
    const libraryStore = writeTransaction.objectStore(LIBRARY_STORE);

    libraryStore.put({
      id: LIBRARY_RECORD_ID,
      library: store.serialize(),
      updatedAt: Date.now(),
    });

    await transactionDone(writeTransaction);
    return createSuccessStatus();
  } catch (error) {
    return createFailureStatus(toPersistenceErrorReason(error), error);
  } finally {
    database?.close();
  }
}

export async function restoreTemplateLibraryFromIndexedDb({ indexedDb = window.indexedDB } = {}) {
  const database = await openDatabase(indexedDb);

  if (!database) {
    return null;
  }

  try {
    const transaction = database.transaction([LIBRARY_STORE], 'readonly');
    const libraryStore = transaction.objectStore(LIBRARY_STORE);
    const libraryRecord = await requestToPromise(libraryStore.get(LIBRARY_RECORD_ID));

    return libraryRecord?.library || null;
  } finally {
    database.close();
  }
}

export const templateLibraryIndexedDbConfig = {
  databaseName: DB_NAME,
  version: DB_VERSION,
  stores: {
    library: LIBRARY_STORE,
  },
};
