import { withRevalidationMeta } from "@kira-joo/backend-toolkit-next";
import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { campaignDetailTags, campaignSlugChangeTags } from "src/server/core/revalidation/revalidate-entity";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { FindCampaignParamsDto } from "src/server/campaigns/dto/find-campaign-params.dto";
import { UpdateCampaignDto } from "src/server/campaigns/dto/update-campaign.dto";
import { resolveCampaignRequiredness } from "src/server/campaigns/resolve-campaign-requiredness";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindCampaignParamsDto,
  auth: { permissions: [AppPermission.CAMPAIGN.READ_ONE] },
  handler: async ({ params }) => campaignRepository.findOne({ where: { _id: params.campaignId } }),
});

// Header fields only — never touches `blocks` (see the blocks/ sub-resource routes).
// `slug` is updatable, so the public response's own `slug` isn't enough to
// know which cache tag(s) to bust — `previousSlug` is metadata the public
// response shouldn't carry, hence `withRevalidationMeta` (see
// revalidate-entity.ts's `campaignSlugChangeTags` for the actual tag logic).
export const PUT = createPutRoute({
  params: FindCampaignParamsDto,
  body: UpdateCampaignDto,
  auth: { permissions: [AppPermission.CAMPAIGN.UPDATE] },
  handler: async ({ params, body }) => {
    const campaign = await campaignRepository.findOne({ where: { _id: params.campaignId } });
    const nextStatus = body.status ?? campaign.status;
    const nextTitle = body.title ?? campaign.title;
    const entity = { title: nextTitle, blocks: campaign.blocks };
    assertPublishReady(entity, nextStatus, resolveCampaignRequiredness(entity));
    const updated = await campaignRepository.update({ where: { _id: params.campaignId } }, body);
    return withRevalidationMeta(updated, { previousSlug: campaign.slug });
  },
  revalidateTags: ({ result: { response, meta } }) => campaignSlugChangeTags(meta.previousSlug, response.slug),
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
    return withRevalidationMeta(undefined, { slug: campaign.slug });
  },
  revalidateTags: ({ result: { meta } }) => campaignDetailTags(meta.slug),
});
