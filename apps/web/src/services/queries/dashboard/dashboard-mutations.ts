import { api } from "@/lib/api";
import { dashboardQueryKeys } from "@/services/queries/dashboard/dashboard-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export function useDashboardMutations(projectKey: string) {
  const queryClient = useQueryClient();

  const invalidateBoard = () =>
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.board(projectKey),
    });

  const moveCardMutation = useMutation({
    mutationFn: api.moveCard,
    onSuccess: invalidateBoard,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    moveCard: moveCardMutation.mutateAsync,
  };
}
