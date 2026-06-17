import type { AsyncStorage } from "@tanstack/react-query-persist-client";
import {
  getPersistedEntity,
  hasIndexedDbSupport,
  removePersistedEntity,
  setPersistedEntity,
} from "@/services/offline/db";

export const indexedDbQueryStorage: AsyncStorage<string> | undefined =
  hasIndexedDbSupport()
    ? {
        getItem: getPersistedEntity,
        setItem: setPersistedEntity,
        removeItem: removePersistedEntity,
      }
    : undefined;
