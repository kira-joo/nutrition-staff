import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Permission } from "../src/common/interfaces/permission.interface";

// Backed by the route handler under src/app/api/permissions.

export const getPermissionsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Permission>;
}> = { url: "/permissions", methodType: MethodType.GET };
