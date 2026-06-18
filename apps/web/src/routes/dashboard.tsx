import { useDashboardQuery } from "@/services/queries/dashboard/dashboard-query";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import { type DragEndEvent, type DragOverEvent } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useEffect, useRef, useState } from "react";
import { useDashboardMutations } from "@/services/queries/dashboard/dashboard-mutations";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";
import { ColumnId } from "@/widgets/kanban/model/types";
import { KanbanBoard, kanbanColumns } from "@/widgets/kanban/ui/KanbanBoard";
import { findTaskPosition } from "@/widgets/kanban/lib/utils";
import { DialogKanbanCard } from "@/widgets/kanban/ui/DialogKanbanCard";

const DASHBOARD_PROJECT_KEY = "KAN";

function createEmptyColumns(): Record<ColumnId, KanbanTask[]> {
  return {
    backlog: [],
    in_progress: [],
    review: [],
    done: [],
  };
}

function isColumnId(value: string): value is ColumnId {
  return kanbanColumns.some((column) => column.id === value);
}

function toDashboardColumns(
  apiColumns: BoardColumn[],
): Record<ColumnId, KanbanTask[]> {
  const nextColumns = createEmptyColumns();

  for (const column of apiColumns) {
    if (isColumnId(column.key)) {
      nextColumns[column.key] = column.tasks;
    }
  }

  return nextColumns;
}

function cloneColumns(columns: Record<ColumnId, KanbanTask[]>) {
  return Object.fromEntries(
    Object.entries(columns).map(([columnId, tasks]) => [columnId, [...tasks]]),
  ) as Record<ColumnId, KanbanTask[]>;
}

export function DashboardPage() {
  const dashboardQuery = useDashboardQuery(DASHBOARD_PROJECT_KEY);
  const { isSyncing } = useOfflineSyncStatus();
  const { moveCard, isBlocked } = useDashboardMutations(DASHBOARD_PROJECT_KEY);
  const isBoardBlocked = isBlocked || isSyncing;
  const [columns, setColumns] =
    useState<Record<ColumnId, KanbanTask[]>>(createEmptyColumns);
  const previousColumns =
    useRef<Record<ColumnId, KanbanTask[]>>(createEmptyColumns());

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
      (column) => column.key === position.columnId,
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

  return (
    <>
      <DialogKanbanCard isOpen={false} />

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
