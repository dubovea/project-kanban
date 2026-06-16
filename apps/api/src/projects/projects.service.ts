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
import { and, asc, eq, inArray } from "drizzle-orm";
import { DatabaseService } from "../database/database.service";
import { projects, boardColumns, issueCards } from "../database/schema";

@Injectable()
export class ProjectsService {
  constructor(private readonly database: DatabaseService) {}

  findAll(): ProjectSummary[] {
    return [];
  }

  async getBoard(projectKey: string): Promise<ProjectBoard> {
    const [project] = await this.database.db
      .select()
      .from(projects)
      .where(eq(projects.key, projectKey));

    if (!project) {
      throw new NotFoundException(`Project ${projectKey} was not found`);
    }
    const columns = await this.database.db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.projectId, project.id))
      .orderBy(asc(boardColumns.position));

    const cards = await this.database.db
      .select()
      .from(issueCards)
      .where(
        inArray(
          issueCards.columnId,
          columns.map((column) => column.id),
        ),
      )
      .orderBy(asc(issueCards.sortOrder));

    const columnsWithTasks = columns.map((column) => ({
      id: column.id,
      key: column.key,
      title: column.title,
      summary: column.summary,
      position: column.position,
      tasks: cards
        .filter((card) => card.columnId === column.id)
        .map((card) => ({
          id: card.id,
          key: card.key,
          title: card.title,
          description: card.description,
          type: card.type,
          priority: card.priority,
          state: card.state,
          assignee: {
            name: card.assigneeName,
            initials: card.assigneeInitials,
          },
          estimate: card.estimate,
          dueDate: card.dueDate,
          updatedAt: card.updatedAt.toISOString(),
          tags: [],
          comments: card.commentsCount,
          attachments: card.attachmentsCount,
        })),
    }));

    return {
      project: {
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description,
        lead: project.lead,
        openIssues: 0,
      },
      columns: columnsWithTasks,
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

  async moveCard(
    projectKey: string,
    cardId: string,
    input: MoveIssueCardInput,
  ): Promise<ProjectBoard> {
    const [project] = await this.database.db
      .select()
      .from(projects)
      .where(eq(projects.key, projectKey));

    if (!project) {
      throw new NotFoundException(`Project ${projectKey} was not found`);
    }

    const [updatedCard] = await this.database.db
      .update(issueCards)
      .set({
        targetColumnId: input.targetColumnId,
        targetIndex: input.targetIndex,
        updatedAt: new Date(),
      })
      .where(
        and(eq(issueCards.id, cardId), eq(issueCards.projectId, project.id)),
      )
      .returning();
  }

  deleteCard(_projectKey: string, _cardId: string): Promise<void> {
    throw new NotImplementedException(
      "Issue card deletion is not implemented yet",
    );
  }
}
