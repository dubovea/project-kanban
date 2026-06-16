import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bug,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  GripVertical,
  MessageSquare,
  Paperclip,
  Sparkles,
} from "lucide-react";
import * as React from "react";
import type {
  KanbanIssueType,
  KanbanPriority,
  KanbanTask,
} from "@project-kanban/shared";

export type { KanbanIssueType, KanbanPriority, KanbanTask };

interface KanbanCardProps extends React.ComponentProps<"div"> {
  task: KanbanTask;
  handleRef?: React.Ref<HTMLButtonElement>;
  isDragSource?: boolean;
  isDropTarget?: boolean;
  isOverlay?: boolean;
  isBlocked?: boolean;
}

const priorityStyles: Record<KanbanPriority, string> = {
  low: "bg-sky-50 text-sky-700 ring-sky-100",
  normal: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  high: "bg-amber-50 text-amber-700 ring-amber-100",
  critical: "bg-rose-50 text-rose-700 ring-rose-100",
};

const typeIcons: Record<
  KanbanIssueType,
  React.ComponentType<{ className?: string }>
> = {
  bug: Bug,
  feature: Sparkles,
  task: CircleDot,
};

export const KanbanCard = React.forwardRef<HTMLDivElement, KanbanCardProps>(
  (
    {
      task,
      handleRef,
      isDragSource = false,
      isDropTarget = false,
      isOverlay = false,
      isBlocked = false,
      className,
      ...props
    },
    ref,
  ) => {
    const TypeIcon = typeIcons[task.type];

    return (
      <Card
        ref={ref}
        className={cn(
          "touch-none select-none overflow-hidden border bg-card transition-[border-color,box-shadow,opacity,transform]",
          isDropTarget && "border-primary shadow-sm",
          isDragSource && "opacity-0",
          isOverlay && "opacity-60 cursor-grabbing shadow-xl",
          !isOverlay && !isBlocked && "cursor-grab active:cursor-grabbing",
          isBlocked && "cursor-not-allowed opacity-70",
          className,
        )}
        {...props}
      >
        <CardHeader className="gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <TypeIcon className="size-4 shrink-0 text-primary" />
              <span className="font-medium text-foreground">{task.key}</span>
              <span className="truncate">{task.state}</span>
            </div>

            <button
              ref={handleRef}
              type="button"
              disabled={isBlocked}
              className={cn(
                "rounded-md p-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                isBlocked && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
              aria-label={`Move ${task.key}`}
            >
              <GripVertical className="size-4" />
            </button>
          </div>

          <CardTitle className="text-sm font-medium leading-5">
            {task.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 p-4 pt-0">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium capitalize ring-1",
                priorityStyles[task.priority],
              )}
            >
              {task.priority === "critical" && (
                <AlertTriangle className="size-3" />
              )}
              {task.priority}
            </span>
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary ring-1 ring-primary/15">
                {task.assignee.initials}
              </span>
              <span className="max-w-32 truncate">{task.assignee.name}</span>
            </div>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" />
              {task.estimate}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" />
              {task.dueDate ?? "No due date"}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3.5" />
                {task.comments}
              </span>
              <span className="inline-flex items-center gap-1">
                <Paperclip className="size-3.5" />
                {task.attachments}
              </span>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
            </span>
          </div>
        </CardContent>
      </Card>
    );
  },
);

KanbanCard.displayName = "KanbanCard";
