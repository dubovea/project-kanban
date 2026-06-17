import { useSyncExternalStore } from "react";

function subscribeToNetworkStatus(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getNetworkStatusSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function useNetworkStatus() {
  return useSyncExternalStore(
    subscribeToNetworkStatus,
    getNetworkStatusSnapshot,
    getServerSnapshot,
  );
}
