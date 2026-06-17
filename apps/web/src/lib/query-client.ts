import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { indexedDbQueryStorage } from "@/services/offline";

const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: QUERY_CACHE_MAX_AGE,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: indexedDbQueryStorage,
  key: "project-kanban-query-cache",
  throttleTime: 1_000,
});

export const queryPersistOptions = {
  persister: queryPersister,
  maxAge: QUERY_CACHE_MAX_AGE,
  buster: "project-kanban-v1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.state.status === "success",
  },
} satisfies Omit<PersistQueryClientOptions, "queryClient">;
