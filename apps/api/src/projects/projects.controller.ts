import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import type {
  CreateBoardColumnInput,
  CreateIssueCardInput,
  MoveIssueCardInput,
  UpdateIssueCardInput,
} from "./projects.types";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(":key/board")
  getBoard(@Param("key") key: string) {
    return this.projectsService.getBoard(key);
  }

  @Post(":key/columns")
  createColumn(
    @Param("key") key: string,
    @Body() input: CreateBoardColumnInput,
  ) {
    return this.projectsService.createColumn(key, input);
  }

  @Post(":key/cards")
  createCard(@Param("key") key: string, @Body() input: CreateIssueCardInput) {
    return this.projectsService.createCard(key, input);
  }

  @Patch(":key/cards/:cardId")
  updateCard(
    @Param("key") key: string,
    @Param("cardId") cardId: string,
    @Body() input: UpdateIssueCardInput,
  ) {
    return this.projectsService.updateCard(key, cardId, input);
  }

  @Post(":key/cards/:cardId/move")
  moveCard(
    @Param("key") key: string,
    @Param("cardId") cardId: string,
    @Body() input: MoveIssueCardInput,
  ) {
    return this.projectsService.moveCard(key, cardId, input);
  }

  @Delete(":key/cards/:cardId")
  deleteCard(@Param("key") key: string, @Param("cardId") cardId: string) {
    return this.projectsService.deleteCard(key, cardId);
  }
}
