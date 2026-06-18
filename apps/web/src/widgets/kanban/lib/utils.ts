import { KanbanTask } from "@project-kanban/shared";
import { kanbanColumns } from "../ui/KanbanBoard";
import { ColumnId } from "../model/types";

export function findTask(
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

export function findTaskPosition(
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
