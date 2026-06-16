import { api } from "@/lib/api";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const dashboardQueryKeys = {
  board: (projectKey: string) => ["projects", projectKey, "board"] as const,
};

export function dashboardBoardQueryOptions(projectKey: string) {
  return queryOptions({
    queryKey: dashboardQueryKeys.board(projectKey),
    queryFn: () => api.board(projectKey),
    enabled: projectKey.trim().length > 0,
    staleTime: 30_000,
  });
}

export function useDashboardQuery(projectKey: string) {
  return useQuery(dashboardBoardQueryOptions(projectKey));
}
