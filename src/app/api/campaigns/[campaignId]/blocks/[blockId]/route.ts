import { removeCampaignBlock, replaceCampaignBlock } from "src/server/campaigns/blocks";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { FindCampaignBlockParamsDto } from "src/server/campaigns/dto/find-campaign-block-params.dto";

// No `body` here — multipart-only, same convention as any asset-bearing route.
export const PUT = createPutRoute({
  params: FindCampaignBlockParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ request, params }) => replaceCampaignBlock(request, params.campaignId, params.blockId),
});

export const DELETE = createDeleteRoute({
  params: FindCampaignBlockParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ params }) => removeCampaignBlock(params.campaignId, params.blockId),
});
