import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { PackagesPageSettingsModel } from "src/server/packages-page-settings/packages-page-settings.schema";

export const packagesPageSettingsRepository = createMongooseRepository({
  model: PackagesPageSettingsModel,
  entityName: EntityName.PACKAGES_PAGE_SETTINGS,
});
