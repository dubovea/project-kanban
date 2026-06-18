import { KanbanCardItem } from "@/widgets/kanban/ui/KanbanCardItem";
import { Button } from "@/components/ui/button";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { KanbanColumnView } from "@/widgets/kanban/ui/KanbanColumnView";
import { findTask } from "../lib/utils";
import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react";
import type { ProjectBoard } from "@/lib/api";
import type { KanbanColumnsById } from "../model/types";

interface KanbanBoardProps {
  board: ProjectBoard;
  columns: KanbanColumnsById;
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
  const navigate = useNavigate();
  const orderedColumns = [...board.columns].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6">
        <section className="grid gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold tracking-normal">
                {board.project.name}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {board.project.description}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              disabled={isBlocked || orderedColumns.length === 0}
              onClick={() => {
                void navigate({
                  to: "/cards/new",
                  search: {
                    columnId: orderedColumns[0]?.id,
                  },
                });
              }}
            >
              <Plus className="size-4" />
              New card
            </Button>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {orderedColumns.map((column) => (
            <KanbanColumnView
              key={column.id}
              isBlocked={isBlocked}
              column={column}
              tasks={columns[column.id] ?? []}
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
