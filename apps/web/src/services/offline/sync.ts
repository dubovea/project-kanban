import {
  listOfflineMutations,
  removeOfflineMutation,
} from "@/services/offline/db";
import { runOfflineMutation } from "@/services/offline/mutation-handlers";
import { syncStore } from "./sync-store";

let isStarted = false;
let isFlushing = false;

export async function flushOfflineMutations() {
  if (isFlushing) {
    return {
      queuedCount: 0,
      syncedCount: 0,
      failedCount: 0,
      message: "Offline sync is already running.",
    };
  }

  isFlushing = true;

  try {
    const queuedMutations = await listOfflineMutations("queued");
    if (queuedMutations.length) {
      syncStore.getState().setSyncing(true);
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const mutation of queuedMutations) {
      try {
        await runOfflineMutation(mutation);
        await removeOfflineMutation(mutation.id);
        syncedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    return {
      queuedCount: queuedMutations.length,
      syncedCount,
      failedCount,
    };
  } finally {
    syncStore.getState().setSyncing(false);
    isFlushing = false;
  }
}

export function startOfflineSync() {
  if (isStarted) {
    return;
  }

  isStarted = true;

  window.addEventListener("online", () => {
    void flushOfflineMutations();
  });

  if (navigator.onLine) {
    void flushOfflineMutations();
  }
}
