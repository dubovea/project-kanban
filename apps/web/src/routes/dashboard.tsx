import { cn } from "@/lib/utils";
import { KanbanCard, type KanbanTask } from "@/widgets/kanban/ui/KanbanCard";
import {
  DragDropProvider,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { Feedback } from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import { useSortable } from "@dnd-kit/react/sortable";
import { useRef, useState } from "react";

type ColumnId = "backlog" | "inProgress" | "review" | "done";

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
    id: "inProgress",
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

const initialColumns: Record<ColumnId, KanbanTask[]> = {
  backlog: [
    {
      id: "issue-1",
      key: "KAN-41",
      title: "Support saved issue searches with user-specific filters",
      description: "Persist filters, sorting, and visibility settings per user.",
      type: "feature",
      priority: "high",
      state: "Open",
      assignee: {
        name: "Alex Johnson",
        initials: "AJ",
      },
      estimate: "5h",
      dueDate: "Jan 10",
      updatedAt: "2h ago",
      tags: ["Search", "UX"],
      comments: 6,
      attachments: 2,
    },
    {
      id: "issue-2",
      key: "KAN-43",
      title: "Add project-level permissions for board visibility",
      description: "Define read and write access for project boards.",
      type: "task",
      priority: "normal",
      state: "Open",
      assignee: {
        name: "Sarah Chen",
        initials: "SC",
      },
      estimate: "3h",
      dueDate: "Jan 15",
      updatedAt: "1d ago",
      tags: ["Access"],
      comments: 2,
      attachments: 1,
    },
    {
      id: "issue-3",
      key: "KAN-48",
      title: "Document workflow transitions for external contributors",
      description: "Create contributor-facing docs for issue state changes.",
      type: "task",
      priority: "low",
      state: "Open",
      assignee: {
        name: "Michael Rodriguez",
        initials: "MR",
      },
      estimate: "2h",
      dueDate: "Jan 20",
      updatedAt: "3d ago",
      tags: ["Docs"],
      comments: 1,
      attachments: 0,
    },
  ],
  inProgress: [
    {
      id: "issue-4",
      key: "KAN-36",
      title: "Create command menu for issues, projects, and reports",
      description: "Add keyboard-first navigation for primary workspace actions.",
      type: "feature",
      priority: "critical",
      state: "In Progress",
      assignee: {
        name: "Emma Wilson",
        initials: "EW",
      },
      estimate: "8h",
      dueDate: "Aug 25",
      updatedAt: "18m ago",
      tags: ["Navigation", "Hotkeys"],
      comments: 11,
      attachments: 3,
    },
    {
      id: "issue-5",
      key: "KAN-39",
      title: "Implement compact dark mode tokens for dense boards",
      description: "Tune spacing, contrast, and surface colors for long work sessions.",
      type: "task",
      priority: "high",
      state: "In Progress",
      assignee: {
        name: "David Kim",
        initials: "DK",
      },
      estimate: "4h",
      dueDate: "Aug 25",
      updatedAt: "42m ago",
      tags: ["Design"],
      comments: 4,
      attachments: 1,
    },
  ],
  review: [
    {
      id: "issue-6",
      key: "KAN-32",
      title: "Fix stale query cache after changing issue state",
      description: "Invalidate board and issue detail queries after state moves.",
      type: "bug",
      priority: "critical",
      state: "Review",
      assignee: {
        name: "Nina Patel",
        initials: "NP",
      },
      estimate: "1h",
      dueDate: "Sep 02",
      updatedAt: "8m ago",
      tags: ["API", "Cache"],
      comments: 8,
      attachments: 0,
    },
  ],
  done: [
    {
      id: "issue-7",
      key: "KAN-1",
      title: "Bootstrap monorepo with React, NestJS, and shared types",
      description: "Create starter workspace structure and shared package.",
      type: "task",
      priority: "normal",
      state: "Done",
      assignee: {
        name: "Aron Thompson",
        initials: "AT",
      },
      estimate: "6h",
      dueDate: "Sep 25",
      updatedAt: "5d ago",
      tags: ["Platform"],
      comments: 5,
      attachments: 2,
    },
    {
      id: "issue-8",
      key: "KAN-2",
      title: "Add first API contract for projects and board columns",
      description: "Expose typed routes for project board data.",
      type: "task",
      priority: "low",
      state: "Done",
      assignee: {
        name: "James Brown",
        initials: "JB",
      },
      estimate: "2h",
      dueDate: "Sep 20",
      updatedAt: "4d ago",
      tags: ["API"],
      comments: 0,
      attachments: 1,
    },
  ],
};

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

function cloneColumns(columns: Record<ColumnId, KanbanTask[]>) {
  return Object.fromEntries(
    Object.entries(columns).map(([columnId, tasks]) => [columnId, [...tasks]]),
  ) as Record<ColumnId, KanbanTask[]>;
}

interface SortableIssueCardProps {
  columnId: ColumnId;
  index: number;
  task: KanbanTask;
}

function SortableIssueCard({ columnId, index, task }: SortableIssueCardProps) {
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
      type: "issue",
    });

  return (
    <KanbanCard
      ref={ref}
      task={task}
      handleRef={handleRef}
      isDragSource={isDragging || isDragSource}
      isDropTarget={isDropTarget}
    />
  );
}

interface KanbanColumnViewProps {
  column: KanbanColumn;
  tasks: KanbanTask[];
}

function KanbanColumnView({ column, tasks }: KanbanColumnViewProps) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    accept: "issue",
    collisionPriority: 0,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <section
      ref={ref}
      className={cn(
        "grid min-h-[32rem] content-start gap-3 rounded-lg border bg-card p-3 transition-colors",
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
  const [columns, setColumns] =
    useState<Record<ColumnId, KanbanTask[]>>(initialColumns);
  const previousColumns =
    useRef<Record<ColumnId, KanbanTask[]>>(initialColumns);

  function handleDragStart(_event: DragStartEvent) {
    previousColumns.current = cloneColumns(columns);
  }

  function handleDragOver(event: DragOverEvent) {
    const { source } = event.operation;

    if (source?.type !== "issue") {
      return;
    }

    setColumns((currentColumns) => move(currentColumns, event));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) {
      setColumns(previousColumns.current);
    }
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6">
        <section className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            Workspace overview
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Operational issue board for product and platform work.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {kanbanColumns.map((column) => (
            <KanbanColumnView
              key={column.id}
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

          return task ? <KanbanCard task={task} isOverlay /> : null;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
