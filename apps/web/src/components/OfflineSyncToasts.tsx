import { useEffect } from "react";
import { toast } from "react-toastify";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";

export function OfflineSyncToasts() {
  const { isSyncing } = useOfflineSyncStatus();

  useEffect(() => {
    if (isSyncing) {
      toast.loading("Syncing offline changes...", {
        toastId: "offline-sync",
      });
      return;
    }

    toast.dismiss("offline-sync");
  }, [isSyncing]);

  return null;
}
