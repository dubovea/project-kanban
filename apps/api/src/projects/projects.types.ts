export interface ProjectSummary {
  id: string;
  key: string;
  name: string;
  description: string;
  lead: string;
  openIssues: number;
}

export interface BoardTask {
  id: string;
  key: string;
  title: string;
  assignee: string;
  priority: "low" | "medium" | "high";
}

export interface BoardColumn {
  id: string;
  title: string;
  tasks: BoardTask[];
}

export interface ProjectBoard {
  project: ProjectSummary;
  columns: BoardColumn[];
}
