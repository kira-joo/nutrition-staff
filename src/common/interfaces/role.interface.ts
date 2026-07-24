import type { Permission } from "./permission.interface";

/** The shape a role has when embedded in another entity's response (e.g. `User.roles`) — no populated permissions. */
export interface RoleSummary {
  _id: string;
  name: string;
  grantsAll: boolean;
  isActive: boolean;
}

/** The full shape returned by the Roles module's own list/detail endpoints, with permissions populated. */
export interface Role extends RoleSummary {
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  grantsAll?: boolean;
  permissions?: string[];
}

export type UpdateRoleDto = Partial<CreateRoleDto> & { isActive?: boolean };

export interface RoleFormValues {
  name: string;
  grantsAll: boolean;
  permissions: string[];
  isActive: boolean;
}
