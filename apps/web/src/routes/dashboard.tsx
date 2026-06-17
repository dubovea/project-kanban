import { cn } from "@/lib/utils";
import { useDashboardQuery } from "@/services/queries/dashboard/dashboard-query";
import { KanbanCard } from "@/widgets/kanban/ui/KanbanCard";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import {
  DragDropProvider,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react/sortable";
import { useEffect, useRef, useState } from "react";
import { useDashboardMutations } from "@/services/queries/dashboard/dashboard-mutations";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";

const DASHBOARD_PROJECT_KEY = "KAN";

type ColumnId = "backlog" | "in_progress" | "review" | "done";

interface KanbanColumn {
  id: ColumnId;
  title: string;
  summary: string;
}

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

interface SortableIssueCardProps {
  isBoardBlocked: boolean;
  columnId: ColumnId;
  index: number;
  task: KanbanTask;
}

function SortableIssueCard({
  isBoardBlocked,
  columnId,
  index,
  task,
}: SortableIssueCardProps) {
  const { ref, handleRef, isDragging, isDragSource, isDropTarget } =
    useSortable({
      accept: "issue",
      data: {
        type: "issue",
        issueId: task.id,
        columnId,
      },
      group: columnId,
      id: task.id,
      index,
      disabled: isBoardBlocked,
      type: "issue",
    });

  return (
    <KanbanCard
      ref={ref}
      task={task}
      handleRef={handleRef}
      isDragSource={isDragging || isDragSource}
      isDropTarget={isDropTarget}
      isBlocked={isBoardBlocked}
    />
  );
}

interface KanbanColumnViewProps {
  isBoardBlocked: boolean;
  column: KanbanColumn;
  tasks: KanbanTask[];
}

function KanbanColumnView({ isBoardBlocked, column, tasks }: KanbanColumnViewProps) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    accept: "issue",
    collisionPriority: 0,
    disabled: isBoardBlocked,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <section
      ref={ref}
      className={cn(
        "grid min-h-128 content-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        isDropTarget && "border-primary bg-accent/60",
      )}
    >
      <header className="flex items-start justify-between gap-3 px-1 py-1">
        <div>
          <h2 className="text-sm font-semibold">{column.title}</h2>
          <p className="text-xs text-muted-foreground">{column.summary}</p>
        </div>
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
          {tasks.length}
        </span>
      </header>

      <div className="grid gap-3">
        {tasks.map((task, index) => (
          <SortableIssueCard
            key={task.id}
            isBoardBlocked={isBoardBlocked}
            columnId={column.id}
            index={index}
            task={task}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No issues
        </div>
      )}
    </section>
  );
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

          return task ? <KanbanCard task={task} isOverlay isBlocked /> : null;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
