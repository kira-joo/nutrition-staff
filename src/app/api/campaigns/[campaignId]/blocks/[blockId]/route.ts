import { removeCampaignBlock, replaceCampaignBlock } from "src/server/campaigns/blocks";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateCampaigns } from "src/server/core/revalidation/revalidate-entity";
import { FindCampaignBlockParamsDto } from "src/server/campaigns/dto/find-campaign-block-params.dto";

export const dynamic = "force-dynamic";

// No `body` here — multipart-only, same convention as any asset-bearing route.
export const PUT = createPutRoute({
  params: FindCampaignBlockParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ request, params }) => {
    const updated = await replaceCampaignBlock(request, params.campaignId, params.blockId);
    await revalidateCampaigns(updated.slug);
    return updated;
  },
});

export const DELETE = createDeleteRoute({
  params: FindCampaignBlockParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ params }) => {
    const updated = await removeCampaignBlock(params.campaignId, params.blockId);
    await revalidateCampaigns(updated.slug);
    return updated;
  },
});
