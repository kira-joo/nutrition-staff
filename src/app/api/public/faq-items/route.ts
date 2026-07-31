import { createGetRoute } from "src/server/core/route-factories";
import { faqItemRepository } from "src/server/faq-items/faq-items.repository";
import { ContentStatus } from "src/common/enums";

// Public, unauthenticated read surface — a flat, published, section-populated
// list; a future nutrition-client can group by section client-side.
export const GET = createGetRoute({
  auth: false,
  handler: async () =>
    faqItemRepository.findAllNoCountPublic({ where: { status: ContentStatus.PUBLISHED }, relations: ["section"] }),
});
