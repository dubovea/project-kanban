import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok" as const,
      service: "project-kanban-api",
      timestamp: new Date().toISOString(),
    };
  }
}
