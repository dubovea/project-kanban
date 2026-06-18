import { api, type ProjectBoard } from "@/lib/api";
import { useNetworkStatus } from "@/lib/network-status";
import {
  enqueueCreateCardMutation,
  enqueueMoveCardMutation,
  enqueueUpdateCardMutation,
} from "@/services/offline";
import { dashboardQueryKeys } from "@/services/queries/dashboard/dashboard-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

type MoveCardParams = Parameters<typeof api.moveCard>[0];
type CreateCardParams = Parameters<typeof api.createCard>[0];
type UpdateCardParams = Parameters<typeof api.updateCard>[0];

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
  const invalidateCard = (cardId: string) =>
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.card(projectKey, cardId),
    });

  const moveCardMutation = useMutation({
    mutationFn: api.moveCard,
    onSuccess: (_data, params) => {
      void invalidateBoard();
      void invalidateCard(params.cardId);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createCardMutation = useMutation({
    mutationFn: api.createCard,
    onSuccess: invalidateBoard,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: api.updateCard,
    onSuccess: (_data, params) => {
      void invalidateBoard();
      void invalidateCard(params.cardId);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createCard = async (params: CreateCardParams) => {
    if (!isOnline) {
      await enqueueCreateCardMutation(params);
      toast.info("Card creation saved offline. Sync is started after online.");

      return undefined;
    }

    return createCardMutation.mutateAsync(params);
  };

  const updateCard = async (params: UpdateCardParams) => {
    if (!isOnline) {
      await enqueueUpdateCardMutation(params);
      toast.info("Card update saved offline. Sync is started after online.");

      return undefined;
    }

    return updateCardMutation.mutateAsync(params);
  };

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

      toast.info("Move saved offline. Sync is started after online.");

      return optimisticBoard;
    }

    return moveCardMutation.mutateAsync(params);
  };

  return {
    createCard,
    moveCard,
    updateCard,
    isBlocked:
      createCardMutation.isPending ||
      moveCardMutation.isPending ||
      updateCardMutation.isPending,
    isCardSubmitting:
      createCardMutation.isPending || updateCardMutation.isPending,
  };
}
