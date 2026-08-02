import { InteractionType } from "../enums";
import type { ClientUserSummary } from "./client.interface";

export interface ClientInteraction {
  _id: string;
  clientProfileId: string;
  type: InteractionType;
  summary: string;
  happenedAt: string;
  nextFollowUpAt?: string;
  createdByUserId: ClientUserSummary;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInteractionDto {
  clientProfileId: string;
  type: InteractionType;
  summary: string;
  happenedAt?: string;
  nextFollowUpAt?: string;
}

export type UpdateClientInteractionDto = Partial<Omit<CreateClientInteractionDto, "clientProfileId" | "type">>;
