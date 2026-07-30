import { IsMongoId } from "class-validator";

// campaignId, not id — matches the plan's literal route spec
// (/api/campaigns/:campaignId/...) so the same param name works
// consistently at both this top level and the nested block routes.
export class FindCampaignParamsDto {
  @IsMongoId()
  campaignId!: string;
}
