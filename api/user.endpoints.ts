import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type {
  CreateUserDto,
  UpdateUserDto,
  User,
} from "../common/interfaces/user.interface";

// These endpoints are defined as if a real backend existed, purely to smoke test
// core's Endpoint/typing patterns. Nothing in this app actually calls them yet —
// see modules/users/data/users.mock.ts for the in-memory data the pages use instead.

export const getUsersEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<User>;
}> = {
  url: "/users",
  methodType: MethodType.GET,
};

export const getUserByIdEndpoint: Endpoint<{
  params: { id: string };
  returnType: User;
}> = {
  url: "/users/:id",
  methodType: MethodType.GET,
};

export const createUserEndpoint: Endpoint<{
  body: CreateUserDto;
  returnType: User;
}> = {
  url: "/users",
  methodType: MethodType.POST,
};

export const updateUserEndpoint: Endpoint<{
  params: { id: string };
  body: UpdateUserDto;
  returnType: User;
}> = {
  url: "/users/:id",
  methodType: MethodType.PATCH,
};

export const deleteUserEndpoint: Endpoint<{
  params: { id: string };
  returnType: void;
}> = {
  url: "/users/:id",
  methodType: MethodType.DELETE,
};
