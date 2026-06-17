import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface OfflineSyncState {
  isSyncing: boolean;
}

interface OfflineSyncActions {
  setSyncing: (value: boolean) => void;
}

type OfflineSyncStore = OfflineSyncState & OfflineSyncActions;

export const syncStore = createStore<OfflineSyncStore>((set) => ({
  isSyncing: false,
  setSyncing: (value: boolean) => set({ isSyncing: value }),
}));

export function useOfflineSyncStatus() {
  return useStore(syncStore);
}
