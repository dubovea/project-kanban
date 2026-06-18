import {
  useDashboardCardQuery,
  useDashboardQuery,
} from "@/services/queries/dashboard/dashboard-query";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import { type DragEndEvent, type DragOverEvent } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useEffect, useRef, useState } from "react";
import { useDashboardMutations } from "@/services/queries/dashboard/dashboard-mutations";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";
import { KanbanBoard } from "@/widgets/kanban/ui/KanbanBoard";
import { findTaskColumnId, findTaskPosition } from "@/widgets/kanban/lib/utils";
import { DialogKanbanCard } from "@/widgets/kanban/ui/DialogKanbanCard";
import {
  toCreateIssueCardInput,
  toUpdateIssueCardInput,
  type KanbanCardFormValues,
} from "@/widgets/kanban/model/card-form-schema";
import { useNavigate } from "@tanstack/react-router";

const DASHBOARD_PROJECT_KEY = "KAN";

type DashboardColumns = Record<string, KanbanTask[]>;

export type DashboardCardRoute =
  | {
      type: "view";
      cardId: string;
    }
  | {
      type: "create";
      columnId?: string;
    }
  | null;

function toDashboardColumns(apiColumns: BoardColumn[]): DashboardColumns {
  return Object.fromEntries(
    apiColumns.map((column) => [column.id, column.tasks]),
  );
}

function cloneColumns(columns: DashboardColumns) {
  return Object.fromEntries(
    Object.entries(columns).map(([columnId, tasks]) => [columnId, [...tasks]]),
  ) as DashboardColumns;
}

interface DashboardPageProps {
  cardRoute?: DashboardCardRoute;
}

export function DashboardPage({ cardRoute = null }: DashboardPageProps) {
  const navigate = useNavigate();
  const cardId = cardRoute?.type === "view" ? cardRoute.cardId : null;
  const dashboardQuery = useDashboardQuery(DASHBOARD_PROJECT_KEY);
  const cardQuery = useDashboardCardQuery(DASHBOARD_PROJECT_KEY, cardId);
  const { isSyncing } = useOfflineSyncStatus();
  const {
    createCard,
    moveCard,
    updateCard,
    isBlocked,
    isCardSubmitting,
  } = useDashboardMutations(DASHBOARD_PROJECT_KEY);
  const isBoardBlocked = isBlocked || isSyncing;
  const [columns, setColumns] = useState<DashboardColumns>({});
  const previousColumns = useRef<DashboardColumns>({});

  useEffect(() => {
    if (!dashboardQuery.data) {
      return;
    }

    const nextColumns = toDashboardColumns(dashboardQuery.data.columns);

    setColumns(nextColumns);
    previousColumns.current = cloneColumns(nextColumns);
  }, [dashboardQuery.data]);

  function handleDragStart() {
    if (isBoardBlocked) {
      return;
    }

    previousColumns.current = cloneColumns(columns);
  }

  function handleDragOver(event: DragOverEvent) {
    if (isBoardBlocked) {
      return;
    }

    const { source } = event.operation;

    if (source?.type !== "issue") {
      return;
    }

    setColumns((currentColumns) => move(currentColumns, event));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (isBoardBlocked) {
      setColumns(previousColumns.current);
      return;
    }

    if (!board) {
      setColumns(previousColumns.current);
      return;
    }

    if (event.canceled) {
      setColumns(previousColumns.current);
      return;
    }

    const { source } = event.operation;

    if (source?.type !== "issue") {
      return;
    }

    const cardId = String(source.id);
    const positionInitial = findTaskPosition(previousColumns.current, cardId);
    const position = findTaskPosition(columns, cardId);

    if (!position || !positionInitial) {
      return;
    }

    if (
      position.index === positionInitial.index &&
      position.columnId === positionInitial.columnId
    ) {
      return;
    }

    const targetColumn = board.columns.find(
      (column) => column.id === position.columnId,
    );

    if (!targetColumn) {
      setColumns(previousColumns.current);
      return;
    }

    void moveCard({
      projectKey: DASHBOARD_PROJECT_KEY,
      cardId,
      input: {
        targetColumnId: targetColumn.id,
        targetIndex: position.index,
      },
    }).catch(() => {
      setColumns(previousColumns.current);
    });
  }

  function closeCardRoute() {
    void navigate({ to: "/" });
  }

  const board = dashboardQuery.data;
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
  const isDialogOpen = Boolean(cardRoute);
  const isDialogLoading =
    cardRoute?.type === "view"
      ? cardQuery.isPending
      : cardRoute?.type === "create" && dashboardQuery.isPending;
  const dialogErrorMessage =
    cardRoute?.type === "view" && cardQuery.isError
      ? cardQuery.error.message
      : undefined;
  const dialog = (
    <DialogKanbanCard
      isOpen={isDialogOpen}
      mode={cardRoute?.type === "create" ? "create" : "view"}
      task={selectedTask}
      columns={boardColumns}
      columnId={dialogColumnId}
      isLoading={isDialogLoading}
      errorMessage={dialogErrorMessage}
      isSubmitting={isCardSubmitting}
      onOpenChange={(open) => {
        if (!open) {
          closeCardRoute();
        }
      }}
      onSubmit={handleCardDialogSubmit}
    />
  );

  if (dashboardQuery.isPending) {
    return (
      <>
        {dialog}
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            Workspace overview
          </h1>
          <p className="text-sm text-muted-foreground">Loading board...</p>
        </section>
      </>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <>
        {dialog}
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            Workspace overview
          </h1>
          <p className="text-sm text-destructive">
            {dashboardQuery.error.message}
          </p>
        </section>
      </>
    );
  }

  if (!board) {
    return <>{dialog}</>;
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
        projectKey: DASHBOARD_PROJECT_KEY,
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
      projectKey: DASHBOARD_PROJECT_KEY,
      cardId: selectedTask.id,
      input: toUpdateIssueCardInput(values, targetColumn),
    });

    if (selectedTaskColumnId && values.columnId !== selectedTaskColumnId) {
      await moveCard({
        projectKey: DASHBOARD_PROJECT_KEY,
        cardId: selectedTask.id,
        input: {
          targetColumnId: values.columnId,
          targetIndex: columns[values.columnId]?.length ?? 0,
        },
      });
    }
  }

  return (
    <>
      {dialog}

      <KanbanBoard
        board={board}
        columns={columns}
        isBlocked={isBoardBlocked}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnd={handleDragEnd}
      />
    </>
  );
}
