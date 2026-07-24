import { createAuthorizationRegistry } from "@kira-joo/backend-toolkit-core";
import { EntityName } from "./entity-name.enum";

export const authorization = createAuthorizationRegistry({ entities: EntityName });
export const AppPermission = authorization.permissions;
