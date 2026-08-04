import { reorderCampaignBlocks } from "src/server/campaigns/blocks";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { revalidateCampaigns } from "src/server/core/revalidation/revalidate-entity";
import { FindCampaignParamsDto } from "src/server/campaigns/dto/find-campaign-params.dto";
import { ReorderCampaignBlocksDto } from "src/server/campaigns/dto/reorder-campaign-blocks.dto";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  params: FindCampaignParamsDto,
  body: ReorderCampaignBlocksDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ params, body }) => {
    const updated = await reorderCampaignBlocks(params.campaignId, body.blockIds);
    await revalidateCampaigns(updated.slug);
    return updated;
  },
});
