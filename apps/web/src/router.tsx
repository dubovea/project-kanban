import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Activity, Columns3, FolderKanban } from "lucide-react";
import { NetworkStatusBadge } from "@/components/NetworkStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BoardPage } from "@/routes/board";
import { DashboardPage, type DashboardCardRoute } from "@/routes/dashboard";
import { ProjectsPage } from "@/routes/projects";

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <FolderKanban className="size-5 text-primary" />
            <span>Project Kanban</span>
            <Badge variant="secondary">starter</Badge>
          </Link>

          <nav className="flex items-center gap-1">
            <NetworkStatusBadge />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Activity className="size-4" />
                Overview
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                <Columns3 className="size-4" />
                Projects
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const dashboardNewCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cards/new",
  validateSearch: (search: Record<string, unknown>) => ({
    columnId: typeof search.columnId === "string" ? search.columnId : undefined,
  }),
  component: function DashboardNewCardRoute() {
    const search = dashboardNewCardRoute.useSearch();
    const cardRoute: DashboardCardRoute = {
      type: "create",
      columnId: search.columnId,
    };

    return <DashboardPage cardRoute={cardRoute} />;
  },
});

const dashboardCardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cards/$cardId",
  component: function DashboardCardRoute() {
    const params = dashboardCardRoute.useParams();
    const cardRoute: DashboardCardRoute = {
      type: "view",
      cardId: params.cardId,
    };

    return <DashboardPage cardRoute={cardRoute} />;
  },
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const boardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectKey/board",
  component: BoardPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dashboardNewCardRoute,
  dashboardCardRoute,
  projectsRoute,
  boardRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
