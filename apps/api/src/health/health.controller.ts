import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@project-kanban/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok" as const,
      service: "project-kanban-api",
      timestamp: new Date().toISOString(),
    };
  }
}
