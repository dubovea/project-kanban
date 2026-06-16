import axios from "axios";
import type {
  BoardColumn,
  CreateBoardColumnInput,
  CreateIssueCardInput,
  HealthResponse,
  KanbanTask,
  MoveIssueCardInput,
  ProjectBoard,
  ProjectSummary,
  UpdateIssueCardInput,
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

export class ApiClientError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.cause = options.cause;
  }
}


interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
}

function getApiErrorMessage(
  data: unknown,
  status?: number,
  statusText?: string,
) {
  if (typeof data === "string" && data.length > 0) {
    return data;
  }

  if (data && typeof data === "object") {
    const body = data as ApiErrorBody;

    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }

    if (body.message) {
      return body.message;
    }

    if (body.error) {
      return body.error;
    }
  }

  if (status) {
    return `Request failed: ${status} ${statusText ?? ""}`.trim();
  }

  return "Unexpected API error";
}

function normalizeApiError(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const data = error.response?.data;

    return new ApiClientError(getApiErrorMessage(data, status, statusText), {
      status,
      code: data?.code ?? error.code,
      details: data,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, { cause: error });
  }

  return new ApiClientError("Unexpected API error", { details: error });
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeApiError(error);

    return Promise.reject(apiError);
  },
);

async function getJson<T>(path: string): Promise<T> {
  const response = await apiClient.get<T>(path);

  return response.data;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<T>(path, body);

  return response.data;
}

async function patchJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await apiClient.patch<T>(path, body);

  return response.data;
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await apiClient.delete<T>(path);

  return response.data;
}

export const api = {
  health: () => getJson<HealthResponse>("/api/health"),
  projects: () => getJson<ProjectSummary[]>("/api/projects"),
  board: (projectKey: string) =>
    getJson<ProjectBoard>(`/api/projects/${projectKey}/board`),
  createColumn: (params: {
    projectKey: string;
    input: CreateBoardColumnInput;
  }) =>
    postJson<BoardColumn>(
      `/api/projects/${params.projectKey}/columns`,
      params.input,
    ),
  createCard: (params: { projectKey: string; input: CreateIssueCardInput }) =>
    postJson<KanbanTask>(
      `/api/projects/${params.projectKey}/cards`,
      params.input,
    ),
  updateCard: (params: {
    projectKey: string;
    cardId: string;
    input: UpdateIssueCardInput;
  }) =>
    patchJson<KanbanTask>(
      `/api/projects/${params.projectKey}/cards/${params.cardId}`,
      params.input,
    ),
  moveCard: async (params: {
    projectKey: string;
    cardId: string;
    input: MoveIssueCardInput;
  }) =>
    postJson<ProjectBoard>(
      `/api/projects/${params.projectKey}/cards/${params.cardId}/move`,
      params.input,
    ),
  deleteCard: (params: { projectKey: string; cardId: string }) =>
    deleteJson<void>(
      `/api/projects/${params.projectKey}/cards/${params.cardId}`,
    ),
};
