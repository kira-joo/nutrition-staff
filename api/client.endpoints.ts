import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Client, CreateClientDto, UpdateClientDto } from "../src/common/interfaces/client.interface";

// Backed by the MongoDB-backed route handlers under src/app/api/clients.

export const getClientsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Client>;
}> = { url: "/clients", methodType: MethodType.GET };

export const getClientByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Client }> = {
  url: "/clients/:id",
  methodType: MethodType.GET,
};

export const createClientEndpoint: Endpoint<{ body: CreateClientDto; returnType: Client }> = {
  url: "/clients",
  methodType: MethodType.POST,
};

export const updateClientEndpoint: Endpoint<{ params: { id: string }; body: UpdateClientDto; returnType: Client }> = {
  url: "/clients/:id",
  methodType: MethodType.PUT,
};

export const deleteClientEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/clients/:id",
  methodType: MethodType.DELETE,
};
