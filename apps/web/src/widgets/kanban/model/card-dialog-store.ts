import { create } from "zustand";

interface KanbanCardDialogUiState {
  isEditing: boolean;
  setEditing: (value: boolean) => void;
  resetDialogUi: () => void;
}

export const useKanbanCardDialogStore = create<KanbanCardDialogUiState>(
  (set) => ({
    isEditing: false,
    setEditing: (value) => set({ isEditing: value }),
    resetDialogUi: () => set({ isEditing: false }),
  }),
);
