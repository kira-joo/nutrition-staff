import { createPermissionRepository } from "@kira-joo/backend-toolkit-mongoose";
import { PermissionModel } from "./role.model";

export const permissionRepository = createPermissionRepository({ model: PermissionModel });
