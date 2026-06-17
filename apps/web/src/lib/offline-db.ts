import type { AsyncStorage } from "@tanstack/react-query-persist-client";

const DATABASE_NAME = "project-kanban-offline";
const DATABASE_VERSION = 1;
const KEY_VALUE_STORE = "entities";
const MUTATION_OUTBOX_STORE = "changes";

const MUTATION_STATUS_INDEX = "status";
const MUTATION_CREATED_AT_INDEX = "createdAt";

interface KeyValueRecord {
  key: string;
  value: string;
  updatedAt: string;
}

export type OfflineMutationStatus = "queued" | "syncing" | "failed";

export interface OfflineMutationEntry<TPayload = unknown> {
  id: string;
  type: string;
  payload: TPayload;
  status: OfflineMutationStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

let databasePromise: Promise<IDBDatabase> | undefined;

function hasIndexedDbSupport() {
  return typeof window !== "undefined" && Boolean(window.indexedDB);
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

function createObjectStores(database: IDBDatabase) {
  if (!database.objectStoreNames.contains(KEY_VALUE_STORE)) {
    database.createObjectStore(KEY_VALUE_STORE, { keyPath: "key" });
  }

  if (!database.objectStoreNames.contains(MUTATION_OUTBOX_STORE)) {
    const mutationStore = database.createObjectStore(MUTATION_OUTBOX_STORE, {
      keyPath: "id",
    });
    mutationStore.createIndex(MUTATION_STATUS_INDEX, "status", {
      unique: false,
    });
    mutationStore.createIndex(MUTATION_CREATED_AT_INDEX, "createdAt", {
      unique: false,
    });
  }
}

export function openProjectKanbanDatabase() {
  if (!hasIndexedDbSupport()) {
    return Promise.reject(new Error("IndexedDB is not available."));
  }
  databasePromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      createObjectStores(request.result);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      reject(new Error("IndexedDB upgrade is blocked by another tab."));
    };
  });

  return databasePromise;
}

export const indexedDbQueryStorage: AsyncStorage<string> | undefined =
  hasIndexedDbSupport()
    ? {
        async getItem(key) {
          const database = await openProjectKanbanDatabase();
          const transaction = database.transaction(KEY_VALUE_STORE, "readonly");
          const store = transaction.objectStore(KEY_VALUE_STORE);
          const record = await requestToPromise<
            KeyValueRecord | undefined
          >(store.get(key));

          return record?.value ?? null;
        },
        async setItem(key, value) {
          const database = await openProjectKanbanDatabase();
          const transaction = database.transaction(KEY_VALUE_STORE, "readwrite");
          const store = transaction.objectStore(KEY_VALUE_STORE);
          store.put({
            key,
            value,
            updatedAt: new Date().toISOString(),
          } satisfies KeyValueRecord);

          await transactionDone(transaction);
        },
        async removeItem(key) {
          const database = await openProjectKanbanDatabase();
          const transaction = database.transaction(KEY_VALUE_STORE, "readwrite");
          const store = transaction.objectStore(KEY_VALUE_STORE);

          store.delete(key);

          await transactionDone(transaction);
        },
      }
    : undefined;

export async function putOfflineMutation<TPayload>(
  entry: OfflineMutationEntry<TPayload>,
) {
  const database = await openProjectKanbanDatabase();
  const transaction = database.transaction(MUTATION_OUTBOX_STORE, "readwrite");
  const store = transaction.objectStore(MUTATION_OUTBOX_STORE);

  store.put(entry);

  await transactionDone(transaction);
}

export async function listOfflineMutations(
  status?: OfflineMutationStatus,
): Promise<OfflineMutationEntry[]> {
  const database = await openProjectKanbanDatabase();
  const transaction = database.transaction(MUTATION_OUTBOX_STORE, "readonly");
  const store = transaction.objectStore(MUTATION_OUTBOX_STORE);

  if (status) {
    return requestToPromise<OfflineMutationEntry[]>(
      store.index(MUTATION_STATUS_INDEX).getAll(status),
    );
  }

  return requestToPromise<OfflineMutationEntry[]>(store.getAll());
}

export async function removeOfflineMutation(id: string) {
  const database = await openProjectKanbanDatabase();
  const transaction = database.transaction(MUTATION_OUTBOX_STORE, "readwrite");
  const store = transaction.objectStore(MUTATION_OUTBOX_STORE);

  store.delete(id);

  await transactionDone(transaction);
}
