import type {
  CreateBoardColumnInput,
  CreateIssueCardInput,
  MoveIssueCardInput,
  UpdateIssueCardInput,
} from "@/lib/api";
import {
  putOfflineMutation,
  type OfflineMutationEntry,
} from "@/services/offline/db";

export interface CreateColumnMutationPayload {
  projectKey: string;
  input: CreateBoardColumnInput;
}

export interface CreateCardMutationPayload {
  projectKey: string;
  input: CreateIssueCardInput;
}

export interface UpdateCardMutationPayload {
  projectKey: string;
  cardId: string;
  input: UpdateIssueCardInput;
}

export interface MoveCardMutationPayload {
  projectKey: string;
  cardId: string;
  input: MoveIssueCardInput;
}

export interface DeleteCardMutationPayload {
  projectKey: string;
  cardId: string;
}

export interface OfflineMutationPayloads {
  createColumn: CreateColumnMutationPayload;
  createCard: CreateCardMutationPayload;
  updateCard: UpdateCardMutationPayload;
  moveCard: MoveCardMutationPayload;
  deleteCard: DeleteCardMutationPayload;
}

export type OfflineMutationType = keyof OfflineMutationPayloads;

export type OfflineMutationOutboxEntry<
  TType extends OfflineMutationType = OfflineMutationType,
> = OfflineMutationEntry<OfflineMutationPayloads[TType]> & {
  type: TType;
};

function createOfflineMutationId(type: OfflineMutationType) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${type}:${randomId}`;
}

export async function enqueueOfflineMutation<TType extends OfflineMutationType>(
  type: TType,
  payload: OfflineMutationPayloads[TType],
) {
  const now = new Date().toISOString();
  const entry = {
    id: createOfflineMutationId(type),
    type,
    payload,
    status: "queued",
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  } satisfies OfflineMutationOutboxEntry<TType>;

  await putOfflineMutation(entry);

  return entry;
}

export function enqueueMoveCardMutation(payload: MoveCardMutationPayload) {
  return enqueueOfflineMutation("moveCard", payload);
}

export function enqueueCreateColumnMutation(
  payload: CreateColumnMutationPayload,
) {
  return enqueueOfflineMutation("createColumn", payload);
}

export function enqueueCreateCardMutation(payload: CreateCardMutationPayload) {
  return enqueueOfflineMutation("createCard", payload);
}

export function enqueueUpdateCardMutation(payload: UpdateCardMutationPayload) {
  return enqueueOfflineMutation("updateCard", payload);
}

export function enqueueDeleteCardMutation(payload: DeleteCardMutationPayload) {
  return enqueueOfflineMutation("deleteCard", payload);
}
