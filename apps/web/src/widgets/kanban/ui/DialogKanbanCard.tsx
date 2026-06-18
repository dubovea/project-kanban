import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { BoardColumn, KanbanTask } from "@/lib/api";
import { useKanbanCardDialogStore } from "@/widgets/kanban/model/card-dialog-store";
import {
  getKanbanCardFormDefaults,
  issueTypeOptions,
  kanbanCardFormSchema,
  priorityOptions,
  type KanbanCardFormValues,
} from "@/widgets/kanban/model/card-form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, Plus, RotateCcw } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

type DialogKanbanCardMode = "create" | "view";

export interface DialogKanbanCardProps {
  isOpen: boolean;
  mode: DialogKanbanCardMode;
  task?: KanbanTask | null;
  columns: BoardColumn[];
  columnId?: string;
  isLoading?: boolean;
  errorMessage?: string;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: KanbanCardFormValues) => Promise<void> | void;
}

export function DialogKanbanCard({
  isOpen,
  mode,
  task,
  columns,
  columnId,
  isLoading = false,
  errorMessage,
  isSubmitting = false,
  onOpenChange,
  onSubmit,
}: DialogKanbanCardProps) {
  const isEditing = useKanbanCardDialogStore((state) => state.isEditing);
  const setEditing = useKanbanCardDialogStore((state) => state.setEditing);
  const resetDialogUi = useKanbanCardDialogStore(
    (state) => state.resetDialogUi,
  );
  const defaults = React.useMemo(
    () => getKanbanCardFormDefaults({ task, columns, columnId }),
    [columnId, columns, task],
  );
  const form = useForm<KanbanCardFormValues>({
    resolver: zodResolver(kanbanCardFormSchema),
    mode: "onChange",
    defaultValues: defaults,
  });

  React.useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  React.useEffect(() => {
    if (!isOpen) {
      resetDialogUi();
      return;
    }

    setEditing(mode === "create");
  }, [isOpen, mode, resetDialogUi, setEditing, task?.id]);

  const isCreateMode = mode === "create";
  const isReadOnly = !isCreateMode && !isEditing;
  const isFormDisabled = isReadOnly || isSubmitting;
  const dialogTitle = isCreateMode ? "New card" : (task?.key ?? "Card");
  const dialogDescription = isCreateMode
    ? "Create an issue in this board."
    : (task?.title ?? "This card is not available on the board.");

  async function handleSubmit(values: KanbanCardFormValues) {
    try {
      await onSubmit(values);

      if (!isCreateMode) {
        setEditing(false);
      }
    } catch {
      // The mutation layer owns toast/error presentation.
    }
  }

  function handleCancelEdit() {
    if (isCreateMode) {
      onOpenChange(false);
      return;
    }

    form.reset(defaults);
    setEditing(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="grid gap-5 p-6">
          <DialogHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="leading-6">{dialogTitle}</DialogTitle>
              <Badge variant={isCreateMode ? "default" : "secondary"}>
                {isCreateMode ? "Create" : isEditing ? "Editing" : "View"}
              </Badge>
              {task && <Badge variant="outline">{task.state}</Badge>}
            </div>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-9 sm:col-span-2" />
                <Skeleton className="h-32 sm:col-span-2" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
              </div>
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : !isCreateMode && !task ? (
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          ) : (
            <Form {...form}>
              <form
                id="kanban-card-form"
                className="grid gap-5"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Implement issue details"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-32 resize-y"
                            placeholder="Scope, acceptance notes, and useful context."
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="columnId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Column</FormLabel>
                        <Select
                          disabled={isFormDisabled}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {columns.map((column) => (
                              <SelectItem key={column.id} value={column.id}>
                                {column.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          disabled={isFormDisabled}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {issueTypeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          disabled={isFormDisabled}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimate</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="3d"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigneeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ada Lovelace"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigneeInitials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initials</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="AL"
                            disabled={isFormDisabled}
                            {...field}
                            onChange={(event) =>
                              field.onChange(event.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tagsText"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="frontend, ux, api"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {task && (
                  <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>
                      Updated {new Date(task.updatedAt).toLocaleString()}
                    </span>
                    <span>{task.comments} comments</span>
                    <span>{task.attachments} attachments</span>
                  </div>
                )}
              </form>
            </Form>
          )}
        </div>

        {!isLoading && !errorMessage && (isCreateMode || task) && (
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            {isReadOnly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button type="button" onClick={() => setEditing(true)}>
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={handleCancelEdit}
                >
                  <RotateCcw className="size-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="kanban-card-form"
                  disabled={isSubmitting}
                >
                  {isCreateMode ? (
                    <Plus className="size-4" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {isCreateMode ? "Create card" : "Save changes"}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

DialogKanbanCard.displayName = "DialogKanbanCard";
