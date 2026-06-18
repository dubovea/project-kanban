import { useDashboardQuery } from "@/services/queries/dashboard/dashboard-query";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import { type DragEndEvent, type DragOverEvent } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useEffect, useRef, useState } from "react";
import { useDashboardMutations } from "@/services/queries/dashboard/dashboard-mutations";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";
import { KanbanBoard } from "@/widgets/kanban/ui/KanbanBoard";
import {
  findTask,
  findTaskColumnId,
  findTaskPosition,
} from "@/widgets/kanban/lib/utils";
import { DialogKanbanCard } from "@/widgets/kanban/ui/DialogKanbanCard";
import {
  toCreateIssueCardInput,
  toUpdateIssueCardInput,
  type KanbanCardFormValues,
} from "@/widgets/kanban/model/card-form-schema";
import {
  type KanbanCardDialogTarget,
  useKanbanCardDialogStore,
} from "@/widgets/kanban/model/card-dialog-store";
import { useNavigate } from "@tanstack/react-router";

const DASHBOARD_PROJECT_KEY = "KAN";

type DashboardColumns = Record<string, KanbanTask[]>;

export type DashboardCardRoute = KanbanCardDialogTarget | null;

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
  const dashboardQuery = useDashboardQuery(DASHBOARD_PROJECT_KEY);
  const { isSyncing } = useOfflineSyncStatus();
  const {
    createCard,
    moveCard,
    updateCard,
    isBlocked,
    isCardSubmitting,
  } = useDashboardMutations(DASHBOARD_PROJECT_KEY);
  const pendingTarget = useKanbanCardDialogStore(
    (state) => state.pendingTarget,
  );
  const clearPendingTarget = useKanbanCardDialogStore(
    (state) => state.clearPendingTarget,
  );
  const isBoardBlocked = isBlocked || isSyncing;
  const [columns, setColumns] = useState<DashboardColumns>({});
  const previousColumns = useRef<DashboardColumns>({});

  useEffect(() => {
    if (!pendingTarget) {
      return;
    }

    if (pendingTarget.type === "view") {
      void navigate({
        to: "/cards/$cardId",
        params: {
          cardId: pendingTarget.cardId,
        },
      });
    } else {
      void navigate({
        to: "/cards/new",
        search: {
          columnId: pendingTarget.columnId,
        },
      });
    }

    clearPendingTarget();
  }, [clearPendingTarget, navigate, pendingTarget]);

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

  if (dashboardQuery.isPending) {
    return (
      <section className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">
          Workspace overview
        </h1>
        <p className="text-sm text-muted-foreground">Loading board...</p>
      </section>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <section className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">
          Workspace overview
        </h1>
        <p className="text-sm text-destructive">
          {dashboardQuery.error.message}
        </p>
      </section>
    );
  }

  const board = dashboardQuery.data;
  const selectedTask =
    cardRoute?.type === "view" ? findTask(columns, cardRoute.cardId) : null;
  const selectedTaskColumnId = findTaskColumnId(
    columns,
    selectedTask?.id ?? null,
  );
  const dialogColumnId =
    cardRoute?.type === "create"
      ? (cardRoute.columnId ?? board.columns[0]?.id)
      : selectedTaskColumnId;
  const isDialogOpen = Boolean(cardRoute);

  async function handleCardDialogSubmit(values: KanbanCardFormValues) {
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
            cardId: createdCard.id,
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
      <DialogKanbanCard
        isOpen={isDialogOpen}
        mode={cardRoute?.type === "create" ? "create" : "view"}
        task={selectedTask}
        columns={board.columns}
        columnId={dialogColumnId}
        isSubmitting={isCardSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            closeCardRoute();
          }
        }}
        onSubmit={handleCardDialogSubmit}
      />

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
