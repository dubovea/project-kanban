import { KanbanTask } from "@project-kanban/shared";
import { ColumnId } from "../model/types";

export function findTask(
  columns: Record<ColumnId, KanbanTask[]>,
  taskId: string | null,
) {
  if (!taskId) {
    return undefined;
  }

  for (const tasks of Object.values(columns)) {
    const task = tasks.find((item) => item.id === taskId);

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
  for (const [columnId, tasks] of Object.entries(columns)) {
    const index = tasks.findIndex((task) => task.id === taskId);

    if (index !== -1) {
      return {
        columnId,
        index,
        task: tasks[index],
      };
    }
  }

  return null;
}

export function findTaskColumnId(
  columns: Record<ColumnId, KanbanTask[]>,
  taskId: string | null,
) {
  if (!taskId) {
    return undefined;
  }

  return findTaskPosition(columns, taskId)?.columnId;
}
