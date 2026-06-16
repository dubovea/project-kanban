import {
  BadRequestException,
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
  ): Promise<void> {
    if (!Number.isInteger(input.targetIndex)) {
      throw new BadRequestException("Target index must be an integer");
    }

    await this.database.db.transaction(async (tx) => {
      const [project] = await tx
        .select()
        .from(projects)
        .where(eq(projects.key, projectKey));

      if (!project) {
        throw new NotFoundException(`Project ${projectKey} was not found`);
      }

      const [targetColumn] = await tx
        .select()
        .from(boardColumns)
        .where(
          and(
            eq(boardColumns.id, input.targetColumnId),
            eq(boardColumns.projectId, project.id),
          ),
        );

      if (!targetColumn) {
        throw new NotFoundException(
          `Column ${input.targetColumnId} was not found`,
        );
      }

      const [card] = await tx
        .select()
        .from(issueCards)
        .where(
          and(eq(issueCards.id, cardId), eq(issueCards.projectId, project.id)),
        );

      if (!card) {
        throw new NotFoundException(`Card ${cardId} was not found`);
      }

      // Порядок мог измениться только в исходной и целевой колонках.
      const affectedColumnIds = Array.from(
        new Set([card.columnId, targetColumn.id]),
      );

      // Загружаем затронутые карточки один раз и собираем новый порядок в памяти.
      const affectedCards = await tx
        .select()
        .from(issueCards)
        .where(inArray(issueCards.columnId, affectedColumnIds))
        .orderBy(asc(issueCards.sortOrder), asc(issueCards.createdAt));

      // Убираем переносимую карточку из старой позиции перед пересчетом порядка.
      const sourceCards = affectedCards.filter(
        (item) => item.columnId === card.columnId && item.id !== card.id,
      );
      const targetCards = affectedCards.filter(
        (item) => item.columnId === targetColumn.id && item.id !== card.id,
      );

      // Ограничиваем индекс, чтобы сброс за пределами списка корректно добавлял карточку в конец.
      const targetIndex = Math.max(
        0,
        Math.min(input.targetIndex, targetCards.length),
      );

      // Вставляем карточку в целевую колонку на позицию, полученную из интерфейса.
      targetCards.splice(targetIndex, 0, {
        ...card,
        columnId: targetColumn.id,
      });

      // При переносе между колонками закрываем разрыв в исходной колонке.
      if (card.columnId !== targetColumn.id) {
        for (const [sortOrder, sourceCard] of sourceCards.entries()) {
          await tx
            .update(issueCards)
            .set({ sortOrder, updatedAt: new Date() })
            .where(eq(issueCards.id, sourceCard.id));
        }
      }

      // Сохраняем итоговый порядок целевой колонки, включая перенесенную карточку.
      for (const [sortOrder, targetCard] of targetCards.entries()) {
        await tx
          .update(issueCards)
          .set({
            columnId: targetColumn.id,
            sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(issueCards.id, targetCard.id));
      }
    });

    return;
  }

  deleteCard(_projectKey: string, _cardId: string): Promise<void> {
    throw new NotImplementedException(
      "Issue card deletion is not implemented yet",
    );
  }
}
