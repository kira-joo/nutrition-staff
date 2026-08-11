import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { CAMPAIGNS_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { CreateCampaignDto } from "src/server/campaigns/dto/create-campaign.dto";
import { ListCampaignsQueryDto } from "src/server/campaigns/dto/list-campaigns-query.dto";
import { resolveCampaignRequiredness } from "src/server/campaigns/resolve-campaign-requiredness";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListCampaignsQueryDto,
  auth: { permissions: [AppPermission.CAMPAIGN.READ] },
  handler: async ({ query }) => campaignRepository.findAllAndCountPublic({ query }),
});

// A Campaign is always created with zero blocks — plain JSON body, no
// multipart here (blocks, the only asset-bearing part, are added afterward
// via their own sub-resource routes).
export const POST = createPostRoute({
  body: CreateCampaignDto,
  auth: { permissions: [AppPermission.CAMPAIGN.CREATE] },
  handler: async ({ body }) => {
    const entity = { title: body.title, blocks: [] };
    assertPublishReady(entity, body.status, resolveCampaignRequiredness(entity));
    return campaignRepository.save({ ...body, blocks: [] });
  },
  revalidateTags: CAMPAIGNS_TAGS,
});
