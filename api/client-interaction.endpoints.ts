import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type {
  ClientInteraction,
  CreateClientInteractionDto,
  UpdateClientInteractionDto,
} from "../src/common/interfaces/client-interaction.interface";

// Backed by the route handlers under src/app/api/client-interactions.

export const getClientInteractionsEndpoint: Endpoint<{
  query: PaginationQuery & { clientProfileId: string } & Record<string, unknown>;
  returnType: PaginatedResponse<ClientInteraction>;
}> = { url: "/client-interactions", methodType: MethodType.GET };

export const createClientInteractionEndpoint: Endpoint<{
  body: CreateClientInteractionDto;
  returnType: ClientInteraction;
}> = { url: "/client-interactions", methodType: MethodType.POST };

export const updateClientInteractionEndpoint: Endpoint<{
  params: { id: string };
  body: UpdateClientInteractionDto;
  returnType: ClientInteraction;
}> = { url: "/client-interactions/:id", methodType: MethodType.PUT };

export const deleteClientInteractionEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/client-interactions/:id",
  methodType: MethodType.DELETE,
};
