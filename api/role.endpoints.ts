import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { CreateRoleDto, Role, UpdateRoleDto } from "../src/common/interfaces/role.interface";

// Backed by the route handlers under src/app/api/roles.

export const getRolesEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Role>;
}> = { url: "/roles", methodType: MethodType.GET };

export const getRoleByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Role }> = {
  url: "/roles/:id",
  methodType: MethodType.GET,
};

export const createRoleEndpoint: Endpoint<{ body: CreateRoleDto; returnType: Role }> = {
  url: "/roles",
  methodType: MethodType.POST,
};

export const updateRoleEndpoint: Endpoint<{ params: { id: string }; body: UpdateRoleDto; returnType: Role }> = {
  url: "/roles/:id",
  methodType: MethodType.PUT,
};

export const deleteRoleEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/roles/:id",
  methodType: MethodType.DELETE,
};
