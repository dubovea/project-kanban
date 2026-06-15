export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

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

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => getJson<HealthResponse>("/api/health"),
  projects: () => getJson<ProjectSummary[]>("/api/projects"),
  board: (projectKey: string) =>
    getJson<ProjectBoard>(`/api/projects/${projectKey}/board`),
};
