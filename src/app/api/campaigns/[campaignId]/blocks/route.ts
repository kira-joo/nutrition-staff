import { addCampaignBlock } from "src/server/campaigns/blocks";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { FindCampaignParamsDto } from "src/server/campaigns/dto/find-campaign-params.dto";

export const dynamic = "force-dynamic";

// No `body` here — multipart-only, same convention as any asset-bearing route.
export const POST = createPostRoute({
  params: FindCampaignParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ request, params }) => addCampaignBlock(request, params.campaignId),
});
