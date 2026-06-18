import type { KanbanTask } from "@/lib/api";

export type ColumnId = string;

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  summary: string;
}

export type KanbanColumnsById = Record<ColumnId, KanbanTask[]>;

export type DashboardCardRoute =
  | {
      type: "view";
      cardId: string;
    }
  | {
      type: "create";
      columnId?: string;
    }
  | null;

export interface KanbanTaskPosition {
  columnId: ColumnId;
  index: number;
  task: KanbanTask;
}
