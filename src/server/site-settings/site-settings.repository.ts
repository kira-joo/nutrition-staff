import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { SiteSettingsModel } from "src/server/site-settings/site-settings.schema";

export const siteSettingsRepository = createMongooseRepository({
  model: SiteSettingsModel,
  entityName: EntityName.SITE_SETTINGS,
});
