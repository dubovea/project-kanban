import { useDashboardQuery } from "@/services/queries/dashboard/dashboard-query";
import { KanbanCardItem } from "@/widgets/kanban/ui/KanbanCardItem";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import {
  DragDropProvider,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useEffect, useRef, useState } from "react";
import { useDashboardMutations } from "@/services/queries/dashboard/dashboard-mutations";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";
import { ColumnId, KanbanColumn } from "@/widgets/kanban/model/types";
import { KanbanColumnView } from "@/widgets/kanban/ui/KanbanColumnView";

const DASHBOARD_PROJECT_KEY = "KAN";

const kanbanColumns: KanbanColumn[] = [
  {
    id: "backlog",
    title: "Backlog",
    summary: "Triaged, not started",
  },
  {
    id: "in_progress",
    title: "In progress",
    summary: "Implementation active",
  },
  {
    id: "review",
    title: "Review",
    summary: "Waiting for validation",
  },
  {
    id: "done",
    title: "Done",
    summary: "Released or closed",
  },
];

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

function findTask(
  columns: Record<ColumnId, KanbanTask[]>,
  taskId: string | null,
) {
  if (!taskId) {
    return undefined;
  }

  for (const column of kanbanColumns) {
    const task = columns[column.id].find((item) => item.id === taskId);

    if (task) {
      return task;
    }
  }

  return undefined;
}

function findTaskPosition(
  columns: Record<ColumnId, KanbanTask[]>,
  taskId: string,
) {
  for (const column of kanbanColumns) {
    const index = columns[column.id].findIndex((task) => task.id === taskId);

    if (index !== -1) {
      return {
        columnId: column.id,
        index,
        task: columns[column.id][index],
      };
    }
  }

  return null;
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

  function handleDragStart(_event: DragStartEvent) {
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
    const position = findTaskPosition(columns, cardId);

    if (!position) {
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
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6">
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            {board.project.name}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {board.project.description}
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {kanbanColumns.map((column) => (
            <KanbanColumnView
              key={column.id}
              isBoardBlocked={isBoardBlocked}
              column={column}
              tasks={columns[column.id]}
            />
          ))}
        </section>
      </div>

      <DragOverlay>
        {(source) => {
          const task = findTask(
            columns,
            typeof source.id === "string" ? source.id : null,
          );

          return task ? (
            <KanbanCardItem task={task} isOverlay isBlocked />
          ) : null;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
