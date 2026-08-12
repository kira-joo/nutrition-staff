import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookSettingsModel } from "src/server/book-settings/book-settings.schema";

export const bookSettingsRepository = createMongooseRepository({
  model: BookSettingsModel,
  entityName: EntityName.BOOK_SETTINGS,
});
