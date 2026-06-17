import { api, type ProjectBoard } from "@/lib/api";
import { useNetworkStatus } from "@/lib/network-status";
import { enqueueMoveCardMutation } from "@/lib/offline-mutations";
import { dashboardQueryKeys } from "@/services/queries/dashboard/dashboard-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

type MoveCardParams = Parameters<typeof api.moveCard>[0];

function applyMoveCardToBoard(
  board: ProjectBoard,
  params: MoveCardParams,
): ProjectBoard | undefined {
  const targetColumnIndex = board.columns.findIndex(
    (column) => column.id === params.input.targetColumnId,
  );

  if (targetColumnIndex === -1) {
    return undefined;
  }

  const nextColumns = board.columns.map((column) => ({
    ...column,
    tasks: [...column.tasks],
  }));
  const sourceColumnIndex = nextColumns.findIndex((column) =>
    column.tasks.some((task) => task.id === params.cardId),
  );

  if (sourceColumnIndex === -1) {
    return undefined;
  }

  const sourceColumn = nextColumns[sourceColumnIndex];
  const sourceTaskIndex = sourceColumn.tasks.findIndex(
    (task) => task.id === params.cardId,
  );
  const [task] = sourceColumn.tasks.splice(sourceTaskIndex, 1);
  const targetColumn = nextColumns[targetColumnIndex];
  const targetIndex = Math.max(
    0,
    Math.min(params.input.targetIndex, targetColumn.tasks.length),
  );

  targetColumn.tasks.splice(targetIndex, 0, {
    ...task,
    state: targetColumn.key,
  });

  return {
    ...board,
    columns: nextColumns,
  };
}

export function useDashboardMutations(projectKey: string) {
  const queryClient = useQueryClient();
  const isOnline = useNetworkStatus();
  const boardQueryKey = dashboardQueryKeys.board(projectKey);

  const invalidateBoard = () =>
    queryClient.invalidateQueries({
      queryKey: boardQueryKey,
    });

  const moveCardMutation = useMutation({
    mutationFn: api.moveCard,
    onSuccess: invalidateBoard,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const moveCard = async (params: MoveCardParams) => {
    if (!isOnline) {
      const previousBoard = queryClient.getQueryData<ProjectBoard>(
        boardQueryKey,
      );
      const optimisticBoard = previousBoard
        ? applyMoveCardToBoard(previousBoard, params)
        : undefined;

      if (!previousBoard || !optimisticBoard) {
        throw new Error("Cached board is unavailable for offline move.");
      }

      queryClient.setQueryData(boardQueryKey, optimisticBoard);

      try {
        await enqueueMoveCardMutation(params);
      } catch (error) {
        queryClient.setQueryData(boardQueryKey, previousBoard);
        throw error;
      }

      toast.info("Move saved offline. Sync is not implemented yet.");

      return optimisticBoard;
    }

    return moveCardMutation.mutateAsync(params);
  };

  return {
    moveCard,
    isBlocked: moveCardMutation.isPending,
  };
}
