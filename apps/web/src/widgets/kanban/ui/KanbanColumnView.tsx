import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/react";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import { KanbanCardItemSortable } from "./KanbanCardItemSortable";

interface KanbanColumnViewProps {
  isBlocked: boolean;
  column: Pick<BoardColumn, "id" | "title" | "summary">;
  tasks: KanbanTask[];
}
export function KanbanColumnView({
  isBlocked,
  column,
  tasks,
}: KanbanColumnViewProps) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    accept: "issue",
    collisionPriority: 0,
    disabled: isBlocked,
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
          <KanbanCardItemSortable
            key={task.id}
            isBlocked={isBlocked}
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

KanbanColumnView.displayName = "KanbanColumnView";
