import { ContentStatus } from "src/common/enums";
import { createGetRoute } from "src/server/core/route-factories";
import { PublicListReviewsQueryDto } from "src/server/reviews/dto/public-list-reviews-query.dto";
import { reviewRepository } from "src/server/reviews/reviews.repository";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// nothing consumes this yet, built now per the plan's "backend complete"
// convention. Always hardcodes status: published; the query DTO has no
// status field at all, so a caller can never ask for drafts.
export const GET = createGetRoute({
  query: PublicListReviewsQueryDto,
  auth: false,
  handler: async ({ query }) => reviewRepository.findAllAndCountPublic({ query, where: { status: ContentStatus.PUBLISHED } }),
});
