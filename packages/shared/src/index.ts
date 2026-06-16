export interface WorkspaceIdentity {
  id: string;
  name: string;
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export type KanbanIssueType = "task" | "bug" | "feature";

export type KanbanPriority = "low" | "normal" | "high" | "critical";

export interface ProjectSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  lead: string;
  openIssues: number;
}

export interface KanbanAssignee {
  name: string;
  initials: string;
}

export interface KanbanTask {
  id: string;
  key: string;
  title: string;
  description: string;
  type: KanbanIssueType;
  priority: KanbanPriority;
  state: string;
  assignee: KanbanAssignee;
  estimate: string;
  dueDate: string | null;
  updatedAt: string;
  tags: string[];
  comments: number;
  attachments: number;
}

export interface BoardColumn {
  id: string;
  key: string;
  title: string;
  summary: string;
  position: number;
  tasks: KanbanTask[];
}

export interface ProjectBoard {
  project: ProjectSummary;
  columns: BoardColumn[];
}

export interface CreateIssueCardInput {
  columnId: string;
  title: string;
  description?: string;
  type: KanbanIssueType;
  priority: KanbanPriority;
  assignee?: KanbanAssignee;
  estimate?: string;
  dueDate?: string | null;
  tags?: string[];
}

export interface UpdateIssueCardInput {
  title?: string;
  description?: string;
  type?: KanbanIssueType;
  priority?: KanbanPriority;
  state?: string;
  assignee?: KanbanAssignee;
  estimate?: string;
  dueDate?: string | null;
  tags?: string[];
}

export interface MoveIssueCardInput {
  targetColumnId: string;
  targetIndex: number;
}

export interface CreateBoardColumnInput {
  key: string;
  title: string;
  summary?: string;
  position?: number;
}
