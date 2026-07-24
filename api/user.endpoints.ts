import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { CreateUserDto, UpdateUserDto, User } from "../src/common/interfaces/user.interface";

// Backed by the MongoDB-backed route handlers under src/app/api/users.

export const getUsersEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<User>;
}> = { url: "/users", methodType: MethodType.GET };

export const getUserByIdEndpoint: Endpoint<{ params: { id: string }; returnType: User }> = {
  url: "/users/:id",
  methodType: MethodType.GET,
};

export const createUserEndpoint: Endpoint<{ body: CreateUserDto; returnType: User }> = {
  url: "/users",
  methodType: MethodType.POST,
};

export const updateUserEndpoint: Endpoint<{ params: { id: string }; body: UpdateUserDto; returnType: User }> = {
  url: "/users/:id",
  methodType: MethodType.PUT,
};

export const deleteUserEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/users/:id",
  methodType: MethodType.DELETE,
};
