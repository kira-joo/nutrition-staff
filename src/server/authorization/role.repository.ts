import { createRoleRepository } from "@kira-joo/backend-toolkit-mongoose";
import { RoleModel } from "./role.model";

export const roleRepository = createRoleRepository({ model: RoleModel });
