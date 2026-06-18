import { KanbanCardItem } from "@/widgets/kanban/ui/KanbanCardItem";
import type { KanbanTask } from "@/lib/api";
import { useSortable } from "@dnd-kit/react/sortable";
import { ColumnId } from "../model/types";
import { useNavigate } from "@tanstack/react-router";

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
  const navigate = useNavigate();
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

  function openCard() {
    if (isBlocked || isDragging || isDragSource) {
      return;
    }

    void navigate({
      to: "/cards/$cardId",
      params: {
        cardId: task.key,
      },
    });
  }

  return (
    <KanbanCardItem
      ref={ref}
      task={task}
      handleRef={handleRef}
      isDragSource={isDragging || isDragSource}
      isDropTarget={isDropTarget}
      isBlocked={isBlocked}
      role="button"
      tabIndex={isBlocked ? -1 : 0}
      onClick={openCard}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openCard();
        }
      }}
    />
  );
}
KanbanCardItemSortable.displayName = "KanbanCardItemSortable";
