import { api } from "@/lib/api";
import type { OfflineMutationEntry } from "@/services/offline/db";
import type {
  CreateCardMutationPayload,
  CreateColumnMutationPayload,
  DeleteCardMutationPayload,
  MoveCardMutationPayload,
  OfflineMutationPayloads,
  OfflineMutationType,
  UpdateCardMutationPayload,
} from "@/services/offline/mutations";

type OfflineMutationHandlerMap = {
  [TType in OfflineMutationType]: (
    payload: OfflineMutationPayloads[TType],
  ) => Promise<unknown>;
};

export const offlineMutationHandlers = {
  moveCard: (payload) => api.moveCard(payload),
  createCard: (payload) => api.createCard(payload),
  updateCard: (payload) => api.updateCard(payload),
  deleteCard: (payload) => api.deleteCard(payload),
  createColumn: (payload) => api.createColumn(payload),
} satisfies OfflineMutationHandlerMap;

export function runOfflineMutation(mutation: OfflineMutationEntry) {
  switch (mutation.type) {
    case "moveCard":
      return offlineMutationHandlers.moveCard(
        mutation.payload as MoveCardMutationPayload,
      );
    case "createCard":
      return offlineMutationHandlers.createCard(
        mutation.payload as CreateCardMutationPayload,
      );
    case "updateCard":
      return offlineMutationHandlers.updateCard(
        mutation.payload as UpdateCardMutationPayload,
      );
    case "deleteCard":
      return offlineMutationHandlers.deleteCard(
        mutation.payload as DeleteCardMutationPayload,
      );
    case "createColumn":
      return offlineMutationHandlers.createColumn(
        mutation.payload as CreateColumnMutationPayload,
      );
    default:
      throw new Error(`Unknown offline mutation type: ${mutation.type}`);
  }
}
