import { useDashboardQuery } from "@/services/queries/dashboard/dashboard-query";
import { useDashboardMutations } from "@/services/queries/dashboard/dashboard-mutations";
import { useOfflineSyncStatus } from "@/services/offline/sync-store";
import { useKanbanBoardDnd } from "@/widgets/kanban/model/hooks/use-kanban-board-dnd";
import { useKanbanCardDialogController } from "@/widgets/kanban/model/hooks/use-kanban-card-dialog-controller";
import type { DashboardCardRoute } from "@/widgets/kanban/model/types";
import { DialogKanbanCard } from "@/widgets/kanban/ui/DialogKanbanCard";
import { KanbanBoard } from "@/widgets/kanban/ui/KanbanBoard";

const DASHBOARD_PROJECT_KEY = "KAN";

interface DashboardPageProps {
  cardRoute?: DashboardCardRoute;
}

function DashboardLoadingState() {
  return (
    <section className="grid gap-2">
      <h1 className="text-2xl font-semibold tracking-normal">
        Workspace overview
      </h1>
      <p className="text-sm text-muted-foreground">Loading board...</p>
    </section>
  );
}

function DashboardErrorState({ message }: { message: string }) {
  return (
    <section className="grid gap-2">
      <h1 className="text-2xl font-semibold tracking-normal">
        Workspace overview
      </h1>
      <p className="text-sm text-destructive">{message}</p>
    </section>
  );
}

export function DashboardPage({ cardRoute = null }: DashboardPageProps) {
  const dashboardQuery = useDashboardQuery(DASHBOARD_PROJECT_KEY);
  const { isSyncing } = useOfflineSyncStatus();
  const {
    createCard,
    moveCard,
    updateCard,
    isBlocked,
    isCardSubmitting,
  } = useDashboardMutations(DASHBOARD_PROJECT_KEY);
  const isBoardBlocked = isBlocked || isSyncing;
  const boardDnd = useKanbanBoardDnd({
    board: dashboardQuery.data,
    isBlocked: isBoardBlocked,
    moveCard,
    projectKey: DASHBOARD_PROJECT_KEY,
  });
  const { dialogProps } = useKanbanCardDialogController({
    board: dashboardQuery.data,
    cardRoute,
    columns: boardDnd.columns,
    createCard,
    updateCard,
    moveCard,
    isSubmitting: isCardSubmitting,
    projectKey: DASHBOARD_PROJECT_KEY,
  });

  const dialog = <DialogKanbanCard {...dialogProps} />;

  if (dashboardQuery.isPending) {
    return (
      <>
        {dialog}
        <DashboardLoadingState />
      </>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <>
        {dialog}
        <DashboardErrorState message={dashboardQuery.error.message} />
      </>
    );
  }

  if (!dashboardQuery.data) {
    return <>{dialog}</>;
  }

  return (
    <>
      {dialog}

      <KanbanBoard
        board={dashboardQuery.data}
        columns={boardDnd.columns}
        isBlocked={isBoardBlocked}
        handleDragStart={boardDnd.handleDragStart}
        handleDragOver={boardDnd.handleDragOver}
        handleDragEnd={boardDnd.handleDragEnd}
      />
    </>
  );
}
