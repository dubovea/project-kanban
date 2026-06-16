import type {
  HealthResponse,
  ProjectBoard,
  ProjectSummary,
} from "@project-kanban/shared";

export type {
  BoardColumn,
  CreateBoardColumnInput,
  CreateIssueCardInput,
  HealthResponse,
  KanbanAssignee,
  KanbanIssueType,
  KanbanPriority,
  KanbanTask,
  MoveIssueCardInput,
  ProjectBoard,
  ProjectSummary,
  UpdateIssueCardInput,
} from "@project-kanban/shared";

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
