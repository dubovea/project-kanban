import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";
import type {
  BoardColumn,
  CreateBoardColumnInput,
  CreateIssueCardInput,
  KanbanTask,
  MoveIssueCardInput,
  ProjectBoard,
  ProjectSummary,
  UpdateIssueCardInput,
} from "./projects.types";

const projects: ProjectSummary[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    key: "KAN",
    name: "Kanban Core",
    description: "Issue tracking, workflows, and board primitives.",
    lead: "Alex Morgan",
    openIssues: 8,
  },
];

const tasks: KanbanTask[] = [
  {
    id: "21111111-1111-4111-8111-111111111111",
    key: "KAN-41",
    title: "Support saved issue searches with user-specific filters",
    description: "Persist filters, sorting, and visibility settings per user.",
    type: "feature",
    priority: "high",
    state: "Open",
    assignee: { name: "Alex Johnson", initials: "AJ" },
    estimate: "5h",
    dueDate: "2026-01-10",
    updatedAt: "2026-06-15T18:00:00.000Z",
    tags: ["Search", "UX"],
    comments: 6,
    attachments: 2,
  },
  {
    id: "21111111-1111-4111-8111-111111111112",
    key: "KAN-43",
    title: "Add project-level permissions for board visibility",
    description: "Define read and write access for project boards.",
    type: "task",
    priority: "normal",
    state: "Open",
    assignee: { name: "Sarah Chen", initials: "SC" },
    estimate: "3h",
    dueDate: "2026-01-15",
    updatedAt: "2026-06-14T12:00:00.000Z",
    tags: ["Access"],
    comments: 2,
    attachments: 1,
  },
  {
    id: "21111111-1111-4111-8111-111111111117",
    key: "KAN-48",
    title: "Document workflow transitions for external contributors",
    description: "Create contributor-facing docs for issue state changes.",
    type: "task",
    priority: "low",
    state: "Open",
    assignee: { name: "Michael Rodriguez", initials: "MR" },
    estimate: "2h",
    dueDate: "2026-01-20",
    updatedAt: "2026-06-12T12:00:00.000Z",
    tags: ["Docs"],
    comments: 1,
    attachments: 0,
  },
  {
    id: "21111111-1111-4111-8111-111111111113",
    key: "KAN-36",
    title: "Create command menu for issues, projects, and reports",
    description: "Add keyboard-first navigation for primary workspace actions.",
    type: "feature",
    priority: "critical",
    state: "In Progress",
    assignee: { name: "Emma Wilson", initials: "EW" },
    estimate: "8h",
    dueDate: "2026-08-25",
    updatedAt: "2026-06-15T19:30:00.000Z",
    tags: ["Navigation", "Hotkeys"],
    comments: 11,
    attachments: 3,
  },
  {
    id: "21111111-1111-4111-8111-111111111118",
    key: "KAN-39",
    title: "Implement compact dark mode tokens for dense boards",
    description:
      "Tune spacing, contrast, and surface colors for long work sessions.",
    type: "task",
    priority: "high",
    state: "In Progress",
    assignee: { name: "David Kim", initials: "DK" },
    estimate: "4h",
    dueDate: "2026-08-25",
    updatedAt: "2026-06-15T19:10:00.000Z",
    tags: ["Design"],
    comments: 4,
    attachments: 1,
  },
  {
    id: "21111111-1111-4111-8111-111111111114",
    key: "KAN-32",
    title: "Fix stale query cache after changing issue state",
    description: "Invalidate board and issue detail queries after state moves.",
    type: "bug",
    priority: "critical",
    state: "Review",
    assignee: { name: "Nina Patel", initials: "NP" },
    estimate: "1h",
    dueDate: "2026-09-02",
    updatedAt: "2026-06-15T19:50:00.000Z",
    tags: ["API", "Cache"],
    comments: 8,
    attachments: 0,
  },
  {
    id: "21111111-1111-4111-8111-111111111115",
    key: "KAN-1",
    title: "Bootstrap monorepo with React, NestJS, and shared types",
    description: "Create starter workspace structure and shared package.",
    type: "task",
    priority: "normal",
    state: "Done",
    assignee: { name: "Aron Thompson", initials: "AT" },
    estimate: "6h",
    dueDate: "2026-09-25",
    updatedAt: "2026-06-10T09:00:00.000Z",
    tags: ["Platform"],
    comments: 5,
    attachments: 2,
  },
  {
    id: "21111111-1111-4111-8111-111111111116",
    key: "KAN-2",
    title: "Add first API contract for projects and board columns",
    description: "Expose typed routes for project board data.",
    type: "task",
    priority: "low",
    state: "Done",
    assignee: { name: "James Brown", initials: "JB" },
    estimate: "2h",
    dueDate: "2026-09-20",
    updatedAt: "2026-06-11T09:00:00.000Z",
    tags: ["API"],
    comments: 0,
    attachments: 1,
  },
];

const boardColumns: Record<string, BoardColumn[]> = {
  KAN: [
    {
      id: "31111111-1111-4111-8111-111111111111",
      key: "backlog",
      title: "Backlog",
      summary: "Triaged, not started",
      position: 0,
      tasks: [tasks[0], tasks[1], tasks[2]],
    },
    {
      id: "31111111-1111-4111-8111-111111111112",
      key: "in_progress",
      title: "In progress",
      summary: "Implementation active",
      position: 1,
      tasks: [tasks[3], tasks[4]],
    },
    {
      id: "31111111-1111-4111-8111-111111111113",
      key: "review",
      title: "Review",
      summary: "Waiting for validation",
      position: 2,
      tasks: [tasks[5]],
    },
    {
      id: "31111111-1111-4111-8111-111111111114",
      key: "done",
      title: "Done",
      summary: "Released or closed",
      position: 3,
      tasks: [tasks[6], tasks[7]],
    },
  ],
};

@Injectable()
export class ProjectsService {
  findAll(): ProjectSummary[] {
    return projects;
  }

  getBoard(projectKey: string): ProjectBoard {
    const project = projects.find(
      (item) => item.key.toLowerCase() === projectKey.toLowerCase(),
    );

    if (!project) {
      throw new NotFoundException(`Project ${projectKey} was not found`);
    }

    return {
      project,
      columns: boardColumns[project.key] ?? [],
    };
  }

  createColumn(
    _projectKey: string,
    _input: CreateBoardColumnInput,
  ): Promise<BoardColumn> {
    throw new NotImplementedException(
      "Board column creation is not implemented yet",
    );
  }

  createCard(
    _projectKey: string,
    _input: CreateIssueCardInput,
  ): Promise<KanbanTask> {
    throw new NotImplementedException(
      "Issue card creation is not implemented yet",
    );
  }

  updateCard(
    _projectKey: string,
    _cardId: string,
    _input: UpdateIssueCardInput,
  ): Promise<KanbanTask> {
    throw new NotImplementedException(
      "Issue card update is not implemented yet",
    );
  }

  moveCard(
    _projectKey: string,
    _cardId: string,
    _input: MoveIssueCardInput,
  ): Promise<ProjectBoard> {
    throw new NotImplementedException("Issue card move is not implemented yet");
  }

  deleteCard(_projectKey: string, _cardId: string): Promise<void> {
    throw new NotImplementedException(
      "Issue card deletion is not implemented yet",
    );
  }
}
