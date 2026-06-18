export type ColumnId = "backlog" | "in_progress" | "review" | "done";

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  summary: string;
}
