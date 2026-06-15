import { useQuery } from "@tanstack/react-query";
import { Server, ShieldCheck, Workflow } from "lucide-react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
  });

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">
          Workspace overview
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A clean starter surface for projects, issues, boards, filters, and
          future workflow automation.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-4 text-primary" />
              API
            </CardTitle>
            <CardDescription>Backend health endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {healthQuery.isPending && "Checking..."}
              {healthQuery.isError && "API is not responding"}
              {healthQuery.data && (
                <span className="font-medium text-emerald-600">
                  {healthQuery.data.status.toUpperCase()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="size-4 text-primary" />
              Router
            </CardTitle>
            <CardDescription>TanStack Router test routes</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            `/`, `/projects`, and `/projects/$projectKey/board` are wired.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Server state
            </CardTitle>
            <CardDescription>TanStack Query configured</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Queries are cached with a conservative starter setup.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
