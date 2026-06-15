import { Injectable, NotFoundException } from "@nestjs/common";
import {
  BoardColumn,
  ProjectBoard,
  ProjectSummary,
} from "./projects.types";

const projects: ProjectSummary[] = [
  {
    id: "0d9cb2f4-8f3a-4a1b-90b7-58d5b35a2b02",
    key: "KAN",
    name: "Kanban Core",
    description: "Issue tracking, workflows, and board primitives.",
    lead: "Alex Morgan",
    openIssues: 7,
  },
  {
    id: "7e9cbf68-f58a-45f0-85b0-cc33e4489d33",
    key: "OPS",
    name: "Operations",
    description: "Internal automation, reporting, and notifications.",
    lead: "Nina Patel",
    openIssues: 4,
  },
];

const boardColumns: Record<string, BoardColumn[]> = {
  KAN: [
    {
      id: "todo",
      title: "To do",
      tasks: [
        {
          id: "kan-1",
          key: "KAN-1",
          title: "Create project settings shell",
          assignee: "Alex Morgan",
          priority: "high",
        },
        {
          id: "kan-2",
          key: "KAN-2",
          title: "Draft issue schema",
          assignee: "Nina Patel",
          priority: "medium",
        },
      ],
    },
    {
      id: "progress",
      title: "In progress",
      tasks: [
        {
          id: "kan-3",
          key: "KAN-3",
          title: "Wire test API endpoints",
          assignee: "Sam Lee",
          priority: "medium",
        },
      ],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        {
          id: "kan-4",
          key: "KAN-4",
          title: "Choose frontend stack",
          assignee: "Alex Morgan",
          priority: "low",
        },
      ],
    },
  ],
  OPS: [
    {
      id: "todo",
      title: "To do",
      tasks: [
        {
          id: "ops-1",
          key: "OPS-1",
          title: "Prepare background jobs module",
          assignee: "Nina Patel",
          priority: "medium",
        },
      ],
    },
    {
      id: "progress",
      title: "In progress",
      tasks: [],
    },
    {
      id: "done",
      title: "Done",
      tasks: [
        {
          id: "ops-2",
          key: "OPS-2",
          title: "Document local environment",
          assignee: "Sam Lee",
          priority: "low",
        },
      ],
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
}
