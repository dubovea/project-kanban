import { move } from "@dnd-kit/helpers";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react";
import { useEffect, useRef, useState } from "react";
import type { MoveIssueCardInput, ProjectBoard } from "@/lib/api";
import {
  cloneKanbanColumns,
  findTaskPosition,
  toKanbanColumnsById,
} from "../../lib/utils";
import type { KanbanColumnsById } from "../types";

type MoveCardMutation = (params: {
  projectKey: string;
  cardId: string;
  input: MoveIssueCardInput;
}) => Promise<unknown>;

interface UseKanbanBoardDndParams {
  board?: ProjectBoard;
  isBlocked: boolean;
  projectKey: string;
  moveCard: MoveCardMutation;
}

interface UseKanbanBoardDndResult {
  columns: KanbanColumnsById;
  handleDragStart: () => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useKanbanBoardDnd({
  board,
  isBlocked,
  moveCard,
  projectKey,
}: UseKanbanBoardDndParams): UseKanbanBoardDndResult {
  const [columns, setColumns] = useState<KanbanColumnsById>({});
  const previousColumns = useRef<KanbanColumnsById>({});

  useEffect(() => {
    if (!board) {
      return;
    }

    const nextColumns = toKanbanColumnsById(board.columns);

    setColumns(nextColumns);
    previousColumns.current = cloneKanbanColumns(nextColumns);
  }, [board]);

  function handleDragStart() {
    if (isBlocked) {
      return;
    }

    previousColumns.current = cloneKanbanColumns(columns);
  }

  function handleDragOver(event: DragOverEvent) {
    if (isBlocked) {
      return;
    }

    const { source } = event.operation;

    if (source?.type !== "issue") {
      return;
    }

    setColumns((currentColumns) => move(currentColumns, event));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (isBlocked || !board) {
      setColumns(previousColumns.current);
      return;
    }

    if (event.canceled) {
      setColumns(previousColumns.current);
      return;
    }

    const { source } = event.operation;

    if (source?.type !== "issue") {
      return;
    }

    const cardId = String(source.id);
    const positionInitial = findTaskPosition(previousColumns.current, cardId);
    const position = findTaskPosition(columns, cardId);

    if (!position || !positionInitial) {
      return;
    }

    if (
      position.index === positionInitial.index &&
      position.columnId === positionInitial.columnId
    ) {
      return;
    }

    const targetColumn = board.columns.find(
      (column) => column.id === position.columnId,
    );

    if (!targetColumn) {
      setColumns(previousColumns.current);
      return;
    }

    void moveCard({
      projectKey,
      cardId,
      input: {
        targetColumnId: targetColumn.id,
        targetIndex: position.index,
      },
    }).catch(() => {
      setColumns(previousColumns.current);
    });
  }

  return {
    columns,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
