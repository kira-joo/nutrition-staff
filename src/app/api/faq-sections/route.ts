import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { CreateFaqSectionDto } from "src/server/faq-sections/dto/create-faq-section.dto";
import { ListFaqSectionsQueryDto } from "src/server/faq-sections/dto/list-faq-sections-query.dto";
import { faqSectionRepository } from "src/server/faq-sections/faq-sections.repository";

export const GET = createGetRoute({
  query: ListFaqSectionsQueryDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.READ] },
  handler: async ({ query }) => faqSectionRepository.findAllAndCountPublic({ query }),
});

export const POST = createPostRoute({
  body: CreateFaqSectionDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.CREATE] },
  handler: async ({ body }) => {
    assertPublishReady(body, body.status);
    return faqSectionRepository.save(body);
  },
});
