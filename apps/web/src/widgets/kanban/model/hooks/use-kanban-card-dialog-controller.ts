import { useDashboardCardQuery } from "@/services/queries/dashboard/dashboard-query";
import { useNavigate } from "@tanstack/react-router";
import type {
  CreateIssueCardInput,
  KanbanTask,
  MoveIssueCardInput,
  ProjectBoard,
  UpdateIssueCardInput,
} from "@/lib/api";
import { findTaskColumnId } from "../../lib/utils";
import {
  toCreateIssueCardInput,
  toUpdateIssueCardInput,
  type KanbanCardFormValues,
} from "../card-form-schema";
import type { DashboardCardRoute, KanbanColumnsById } from "../types";

type CreateCardMutation = (params: {
  projectKey: string;
  input: CreateIssueCardInput;
}) => Promise<KanbanTask | undefined>;

type UpdateCardMutation = (params: {
  projectKey: string;
  cardId: string;
  input: UpdateIssueCardInput;
}) => Promise<KanbanTask | undefined>;

type MoveCardMutation = (params: {
  projectKey: string;
  cardId: string;
  input: MoveIssueCardInput;
}) => Promise<unknown>;

interface UseKanbanCardDialogControllerParams {
  board?: ProjectBoard;
  cardRoute: DashboardCardRoute;
  columns: KanbanColumnsById;
  createCard: CreateCardMutation;
  updateCard: UpdateCardMutation;
  moveCard: MoveCardMutation;
  isSubmitting: boolean;
  projectKey: string;
}

export function useKanbanCardDialogController({
  board,
  cardRoute,
  columns,
  createCard,
  updateCard,
  moveCard,
  isSubmitting,
  projectKey,
}: UseKanbanCardDialogControllerParams) {
  const navigate = useNavigate();
  const cardId = cardRoute?.type === "view" ? cardRoute.cardId : null;
  const cardQuery = useDashboardCardQuery(projectKey, cardId);
  const boardColumns = board?.columns ?? [];
  const selectedTask =
    cardRoute?.type === "view" ? (cardQuery.data ?? null) : null;
  const selectedTaskColumnId =
    selectedTask?.columnId ??
    findTaskColumnId(
      columns,
      cardRoute?.type === "view" ? cardRoute.cardId : null,
    );
  const dialogColumnId =
    cardRoute?.type === "create"
      ? (cardRoute.columnId ?? boardColumns[0]?.id)
      : selectedTaskColumnId;
  const isDialogLoading =
    cardRoute?.type === "view"
      ? cardQuery.isPending
      : cardRoute?.type === "create" && !board;
  const dialogErrorMessage =
    cardRoute?.type === "view" && cardQuery.isError
      ? cardQuery.error.message
      : undefined;
  const dialogMode =
    cardRoute?.type === "create" ? ("create" as const) : ("view" as const);

  function closeCardRoute() {
    void navigate({ to: "/" });
  }

  async function handleCardDialogSubmit(values: KanbanCardFormValues) {
    if (!board) {
      return;
    }

    const targetColumn = board.columns.find(
      (column) => column.id === values.columnId,
    );

    if (cardRoute?.type === "create") {
      const createdCard = await createCard({
        projectKey,
        input: toCreateIssueCardInput(values),
      });

      if (createdCard) {
        void navigate({
          to: "/cards/$cardId",
          params: {
            cardId: createdCard.key,
          },
        });
      } else {
        closeCardRoute();
      }

      return;
    }

    if (cardRoute?.type !== "view" || !selectedTask) {
      return;
    }

    await updateCard({
      projectKey,
      cardId: selectedTask.id,
      input: toUpdateIssueCardInput(values, targetColumn),
    });

    if (selectedTaskColumnId && values.columnId !== selectedTaskColumnId) {
      await moveCard({
        projectKey,
        cardId: selectedTask.id,
        input: {
          targetColumnId: values.columnId,
          targetIndex: columns[values.columnId]?.length ?? 0,
        },
      });
    }
  }

  return {
    dialogProps: {
      isOpen: Boolean(cardRoute),
      mode: dialogMode,
      task: selectedTask,
      columns: boardColumns,
      columnId: dialogColumnId,
      isLoading: isDialogLoading,
      errorMessage: dialogErrorMessage,
      isSubmitting,
      onOpenChange: (open: boolean) => {
        if (!open) {
          closeCardRoute();
        }
      },
      onSubmit: handleCardDialogSubmit,
    },
  };
}
