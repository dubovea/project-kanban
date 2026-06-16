import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { api, type KanbanTask } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const priorityVariant: Record<KanbanTask["priority"], string> = {
  low: "bg-sky-50 text-sky-700",
  normal: "bg-zinc-100 text-zinc-700",
  high: "bg-rose-50 text-rose-700",
  critical: "bg-red-50 text-red-700",
};

export function BoardPage() {
  const { projectKey } = useParams({ strict: false }) as {
    projectKey: string;
  };

  const boardQuery = useQuery({
    queryKey: ["projects", projectKey, "board"],
    queryFn: () => api.board(projectKey),
    enabled: Boolean(projectKey),
  });

  if (boardQuery.isPending) {
    return <p className="text-sm">Loading board...</p>;
  }

  if (boardQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Board is unavailable
          </CardTitle>
          <CardDescription>{boardQuery.error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            {boardQuery.data.project.name}
          </h1>
          <Badge variant="outline">{boardQuery.data.project.key}</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Static starter board from the API. Drag-and-drop can be layered on top
          once the issue model is ready.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {boardQuery.data.columns.map((column) => (
          <Card key={column.id} className="min-h-80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {column.title}
                <Badge variant="secondary">{column.tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {column.tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-lg border bg-background p-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {task.key}
                      </p>
                      <h2 className="mt-1 text-sm font-medium">{task.title}</h2>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${priorityVariant[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {task.assignee.name}
                  </p>
                </article>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
