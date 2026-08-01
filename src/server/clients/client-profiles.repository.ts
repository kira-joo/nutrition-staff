import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ClientProfileModel } from "src/server/clients/client-profile.schema";

export const clientProfileRepository = createMongooseRepository({
  model: ClientProfileModel,
  entityName: EntityName.CLIENT,
});
