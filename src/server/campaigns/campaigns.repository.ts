import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { CampaignModel } from "src/server/campaigns/campaign.schema";

export const campaignRepository = createMongooseRepository({
  model: CampaignModel,
  entityName: EntityName.CAMPAIGN,
});
