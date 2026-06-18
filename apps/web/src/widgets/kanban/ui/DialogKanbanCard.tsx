import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DialogKanbanCardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogKanbanCard({
  isOpen = false,
  onOpenChange,
}: DialogKanbanCardProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

DialogKanbanCard.displayName = "DialogKanbanCard";
