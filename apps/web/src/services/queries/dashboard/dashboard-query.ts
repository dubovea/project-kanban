import { api } from "@/lib/api";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const dashboardQueryKeys = {
  board: (projectKey: string) => ["projects", projectKey, "board"] as const,
  card: (projectKey: string, cardId: string) =>
    ["projects", projectKey, "cards", cardId] as const,
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

export function dashboardCardQueryOptions(
  projectKey: string,
  cardId: string | null | undefined,
) {
  return queryOptions({
    queryKey: dashboardQueryKeys.card(projectKey, cardId ?? ""),
    queryFn: () => api.card({ projectKey, cardId: cardId ?? "" }),
    enabled: projectKey.trim().length > 0 && Boolean(cardId),
    staleTime: 30_000,
  });
}

export function useDashboardCardQuery(
  projectKey: string,
  cardId: string | null | undefined,
) {
  return useQuery(dashboardCardQueryOptions(projectKey, cardId));
}
