import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateCampaigns } from "src/server/core/revalidation/revalidate-entity";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { FindCampaignParamsDto } from "src/server/campaigns/dto/find-campaign-params.dto";
import { UpdateCampaignDto } from "src/server/campaigns/dto/update-campaign.dto";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindCampaignParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.READ_ONE] },
  handler: async ({ params }) => campaignRepository.findOne({ where: { _id: params.campaignId } }),
});

// Header fields only — never touches `blocks` (see the blocks/ sub-resource routes).
export const PUT = createPutRoute({
  params: FindCampaignParamsDto,
  body: UpdateCampaignDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ params, body }) => {
    const campaign = await campaignRepository.findOne({ where: { _id: params.campaignId } });
    const nextStatus = body.status ?? campaign.status;
    const nextTitle = body.title ?? campaign.title;
    assertPublishReady({ title: nextTitle, blocks: campaign.blocks }, nextStatus);
    const updated = await campaignRepository.update({ where: { _id: params.campaignId } }, body);

    // `slug` is updatable — revalidate the previous slug's cached detail
    // page unconditionally, and the new one too if it changed, so neither
    // is left serving stale content.
    await revalidateCampaigns(campaign.slug);
    if (body.slug && body.slug !== campaign.slug) {
      await revalidateCampaigns(body.slug);
    }

    return updated;
  },
});

// Soft delete — every embedded block asset stays untouched and
// recoverable, per the asset lifecycle rules (soft delete never destroys
// assets; only a hard delete would, and this entity has no hard-delete route).
export const DELETE = createDeleteRoute({
  params: FindCampaignParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.DELETE] },
  handler: async ({ params }) => {
    const campaign = await campaignRepository.findOne({ where: { _id: params.campaignId } });
    await campaignRepository.softDelete({ where: { _id: params.campaignId } });
    await revalidateCampaigns(campaign.slug);
  },
});
