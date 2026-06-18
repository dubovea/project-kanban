import type { BoardColumn, KanbanTask } from "@/lib/api";
import type {
  ColumnId,
  KanbanColumnsById,
  KanbanTaskPosition,
} from "../model/types";

export function toKanbanColumnsById(
  apiColumns: BoardColumn[],
): KanbanColumnsById {
  return Object.fromEntries(
    apiColumns.map((column) => [column.id, column.tasks]),
  );
}

export function cloneKanbanColumns(columns: KanbanColumnsById) {
  return Object.fromEntries(
    Object.entries(columns).map(([columnId, tasks]) => [columnId, [...tasks]]),
  ) as KanbanColumnsById;
}

export function findTask(
  columns: KanbanColumnsById,
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
  columns: KanbanColumnsById,
  taskId: string,
): KanbanTaskPosition | null {
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
  columns: KanbanColumnsById,
  taskId: string | null,
) {
  if (!taskId) {
    return undefined;
  }

  for (const [columnId, tasks] of Object.entries(columns)) {
    if (tasks.some((task) => task.id === taskId || task.key === taskId)) {
      return columnId;
    }
  }

  return findTaskPosition(columns, taskId)?.columnId;
}
