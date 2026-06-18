import type {
  BoardColumn,
  CreateIssueCardInput,
  KanbanIssueType,
  KanbanPriority,
  KanbanTask,
  UpdateIssueCardInput,
} from "@/lib/api";
import { z } from "zod";

export const issueTypeOptions = [
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
] satisfies Array<{ value: KanbanIssueType; label: string }>;

export const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] satisfies Array<{ value: KanbanPriority; label: string }>;

export const kanbanCardFormSchema = z.object({
  columnId: z.string().min(1, "Select a column."),
  title: z
    .string()
    .trim()
    .min(3, "Title should contain at least 3 characters.")
    .max(120, "Title should fit within 120 characters."),
  description: z
    .string()
    .trim()
    .max(2_000, "Description should fit within 2000 characters."),
  type: z.enum(["task", "bug", "feature"]),
  priority: z.enum(["low", "normal", "high", "critical"]),
  assigneeName: z
    .string()
    .trim()
    .min(2, "Assignee name should contain at least 2 characters.")
    .max(80, "Assignee name should fit within 80 characters."),
  assigneeInitials: z
    .string()
    .trim()
    .min(1, "Initials are required.")
    .max(4, "Use 4 characters or fewer.")
    .regex(/^[\p{L}\p{N}]+$/u, "Use letters or numbers only."),
  estimate: z
    .string()
    .trim()
    .min(1, "Estimate is required.")
    .max(24, "Estimate should fit within 24 characters."),
  dueDate: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) {
        return true;
      }

      return !Number.isNaN(Date.parse(`${value}T00:00:00`));
    }, "Use a valid date."),
  tagsText: z
    .string()
    .trim()
    .max(240, "Tags should fit within 240 characters."),
});

export type KanbanCardFormValues = z.infer<typeof kanbanCardFormSchema>;

export function getKanbanCardFormDefaults(params: {
  task?: KanbanTask | null;
  columns: BoardColumn[];
  columnId?: string;
}): KanbanCardFormValues {
  const { task, columns, columnId } = params;

  return {
    columnId: columnId ?? task?.columnId ?? columns[0]?.id ?? "",
    title: task?.title ?? "",
    description: task?.description ?? "",
    type: task?.type ?? "task",
    priority: task?.priority ?? "normal",
    assigneeName: task?.assignee.name ?? "",
    assigneeInitials: task?.assignee.initials ?? "",
    estimate: task?.estimate ?? "",
    dueDate: task?.dueDate ?? "",
    tagsText: task?.tags.join(", ") ?? "",
  };
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function toAssignee(values: KanbanCardFormValues) {
  return {
    name: values.assigneeName,
    initials: values.assigneeInitials.toUpperCase(),
  };
}

export function toCreateIssueCardInput(
  values: KanbanCardFormValues,
): CreateIssueCardInput {
  return {
    columnId: values.columnId,
    title: values.title,
    description: values.description,
    type: values.type,
    priority: values.priority,
    assignee: toAssignee(values),
    estimate: values.estimate,
    dueDate: values.dueDate || null,
    tags: parseTags(values.tagsText),
  };
}

export function toUpdateIssueCardInput(
  values: KanbanCardFormValues,
  column?: BoardColumn,
): UpdateIssueCardInput {
  return {
    title: values.title,
    description: values.description,
    type: values.type,
    priority: values.priority,
    state: column?.key,
    assignee: toAssignee(values),
    estimate: values.estimate,
    dueDate: values.dueDate || null,
    tags: parseTags(values.tagsText),
  };
}
