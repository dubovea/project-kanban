import { create } from "zustand";

export type KanbanCardDialogTarget =
  | {
      type: "view";
      cardId: string;
    }
  | {
      type: "create";
      columnId?: string;
    };

interface KanbanCardDialogState {
  pendingTarget: KanbanCardDialogTarget | null;
  openCard: (cardId: string) => void;
  createCard: (columnId?: string) => void;
  clearPendingTarget: () => void;
}

export const useKanbanCardDialogStore = create<KanbanCardDialogState>(
  (set) => ({
    pendingTarget: null,
    openCard: (cardId) =>
      set({
        pendingTarget: {
          type: "view",
          cardId,
        },
      }),
    createCard: (columnId) =>
      set({
        pendingTarget: {
          type: "create",
          columnId,
        },
      }),
    clearPendingTarget: () => set({ pendingTarget: null }),
  }),
);
