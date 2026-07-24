import { MethodType, type Endpoint, type PaginationQuery } from "@kira-joo/frontend-toolkit-core";
import type { Role } from "../src/common/interfaces/role.interface";

// Backed by the route handler under src/app/api/roles.

export const getRolesEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: Role[];
}> = { url: "/roles", methodType: MethodType.GET };
