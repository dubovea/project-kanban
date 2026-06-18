import { KanbanCardItem } from "@/widgets/kanban/ui/KanbanCardItem";
import type { KanbanTask } from "@/lib/api";
import { useSortable } from "@dnd-kit/react/sortable";
import { ColumnId } from "../model/types";

interface KanbanCardItemSortableProps {
  isBlocked: boolean;
  columnId: ColumnId;
  index: number;
  task: KanbanTask;
}

export function KanbanCardItemSortable({
  isBlocked,
  columnId,
  index,
  task,
}: KanbanCardItemSortableProps) {
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
      disabled: isBlocked,
      type: "issue",
    });

  return (
    <KanbanCardItem
      ref={ref}
      task={task}
      handleRef={handleRef}
      isDragSource={isDragging || isDragSource}
      isDropTarget={isDropTarget}
      isBlocked={isBlocked}
    />
  );
}
KanbanCardItemSortable.displayName = "KanbanCardItemSortable";
