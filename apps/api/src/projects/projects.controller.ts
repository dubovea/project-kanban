import { Controller, Get, Param } from "@nestjs/common";
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
}
