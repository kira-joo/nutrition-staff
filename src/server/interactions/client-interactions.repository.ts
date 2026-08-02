import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ClientInteractionModel } from "src/server/interactions/client-interaction.schema";

export const clientInteractionRepository = createMongooseRepository({
  model: ClientInteractionModel,
  entityName: EntityName.CLIENT_INTERACTION,
});
