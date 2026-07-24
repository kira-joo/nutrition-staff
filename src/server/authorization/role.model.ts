import { createPermissionModel, createRoleModel } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "./entity-name.enum";

// EntityName.ROLE/PERMISSION are passed explicitly as the Mongoose model
// name (rather than relying on createRoleModel()/createPermissionModel()'s
// own "Role"/"Permission" defaults) so the authorization entity name and the
// actual model/collection name can never silently drift apart — they
// intentionally represent the exact same entity.
export const RoleModel = createRoleModel({ modelName: EntityName.ROLE });
export const PermissionModel = createPermissionModel({ modelName: EntityName.PERMISSION });
