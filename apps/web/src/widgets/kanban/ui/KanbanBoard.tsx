import { KanbanCardItem } from "@/widgets/kanban/ui/KanbanCardItem";
import {
  DragDropProvider,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
} from "@dnd-kit/react";
import { KanbanColumn } from "@/widgets/kanban/model/types";
import { KanbanColumnView } from "@/widgets/kanban/ui/KanbanColumnView";
import { findTask } from "../lib/utils";

export const kanbanColumns: KanbanColumn[] = [
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
];

interface KanbanBoardProps {
  board: any;
  columns: any;
  isBlocked: boolean;
  handleDragStart: () => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function KanbanBoard({
  board,
  columns,
  isBlocked,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
}: KanbanBoardProps) {
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
              isBlocked={isBlocked}
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
            <KanbanCardItem task={task} isOverlay isBlocked={isBlocked} />
          ) : null;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}

KanbanBoard.displayName = "KanbanBoard";
