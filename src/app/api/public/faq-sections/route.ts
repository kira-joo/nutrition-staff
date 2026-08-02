import { createGetRoute } from "src/server/core/route-factories";
import { faqSectionRepository } from "src/server/faq-sections/faq-sections.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: false,
  handler: async () => faqSectionRepository.findAllNoCountPublic({ where: { status: ContentStatus.PUBLISHED } }),
});
