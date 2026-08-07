import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import { createGetRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { siteSettingsRepository } from "src/server/site-settings/site-settings.repository";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface resolving SiteSettings.activeCampaignId
// (a raw ObjectId, admin-only) into the actual currently-valid public
// Campaign — nutrition-client must never translate a Mongo id into a slug
// itself; that translation belongs at this boundary, not in the client.
//
// Same visibility contract as GET /api/public/campaigns/[slug]: an admin may
// select a campaign as "active" before its own startDate, or leave a
// selection in place past its endDate (or after unpublishing/deleting it) —
// public exposure is always additionally gated on status === Published AND
// the current time falling within [startDate, endDate], encoded directly in
// the lookup criteria. No active-campaign selection, an unset selection, or
// one that fails that gate all 404 identically — indistinguishable from each
// other, exactly like the slug endpoint never leaks *why* a slug 404s.
//
// Returns the exact same public Campaign shape as the slug endpoint (not a
// bespoke "banner projection") — the schema has no separate banner-only
// fields to project, and nutrition-client already fully models this shape
// via getCampaign(), so the homepage banner can pull title/slug/hero block
// straight out of it without a second type or a second fetch pattern.
export const GET = createGetRoute({
  auth: false,
  handler: async () => {
    const settings = await getOrCreateSingleton(siteSettingsRepository, {});
    if (!settings.activeCampaignId) {
      throw new NotFoundError("No active campaign is configured");
    }

    const now = new Date();
    return campaignRepository.findOne({
      where: {
        _id: settings.activeCampaignId,
        status: ContentStatus.PUBLISHED,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    });
  },
});
