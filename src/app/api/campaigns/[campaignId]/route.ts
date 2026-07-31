import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { FindCampaignParamsDto } from "src/server/campaigns/dto/find-campaign-params.dto";
import { UpdateCampaignDto } from "src/server/campaigns/dto/update-campaign.dto";

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
    return campaignRepository.update({ where: { _id: params.campaignId } }, body);
  },
});

// Soft delete — every embedded block asset stays untouched and
// recoverable, per the asset lifecycle rules (soft delete never destroys
// assets; only a hard delete would, and this entity has no hard-delete route).
export const DELETE = createDeleteRoute({
  params: FindCampaignParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.DELETE] },
  handler: async ({ params }) => {
    await campaignRepository.softDelete({ where: { _id: params.campaignId } });
  },
});
