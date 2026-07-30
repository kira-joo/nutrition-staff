import { createGetRoute } from "src/server/core/route-factories";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { FindCampaignBySlugParamsDto } from "src/server/campaigns/dto/find-campaign-by-slug-params.dto";
import { ContentStatus } from "src/common/enums";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as every other module. Per the plan's
// active-campaign timing decision, a Published campaign may be set active
// before its own startDate, but public *visibility* is always additionally
// gated on the current time falling within [startDate, endDate] — encoded
// directly in the lookup criteria so a draft, expired, or not-yet-started
// campaign 404s exactly like a nonexistent slug, never leaking which one it is.
export const GET = createGetRoute({
  params: FindCampaignBySlugParamsDto,
  auth: false,
  handler: async ({ params }) => {
    const now = new Date();
    return campaignRepository.findOne({
      where: {
        slug: params.slug,
        status: ContentStatus.PUBLISHED,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    });
  },
});
