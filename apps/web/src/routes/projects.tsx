import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProjectsPage() {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects,
  });

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Test data from the NestJS API. Later this is where real PostgreSQL
          projects will appear.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {projectsQuery.isPending && <p className="text-sm">Loading...</p>}
        {projectsQuery.isError && (
          <p className="text-sm text-destructive">Failed to load projects.</p>
        )}
        {projectsQuery.data?.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{project.name}</CardTitle>
                <Badge variant="outline">{project.key}</Badge>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Lead: <span className="text-foreground">{project.lead}</span>
                <span className="mx-2">/</span>
                Open issues:{" "}
                <span className="text-foreground">{project.openIssues}</span>
              </div>
              <Button asChild size="sm">
                <Link
                  to="/projects/$projectKey/board"
                  params={{ projectKey: project.key }}
                >
                  Board
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
