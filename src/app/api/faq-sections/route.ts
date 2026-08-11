import { createDtoRequirednessResolver } from "@kira-joo/backend-toolkit-core";
import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { FAQ_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreateFaqSectionDto } from "src/server/faq-sections/dto/create-faq-section.dto";
import { ListFaqSectionsQueryDto } from "src/server/faq-sections/dto/list-faq-sections-query.dto";
import { faqSectionRepository } from "src/server/faq-sections/faq-sections.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListFaqSectionsQueryDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.READ] },
  handler: async ({ query }) => faqSectionRepository.findAllAndCountPublic({ query }),
});

export const POST = createPostRoute({
  body: CreateFaqSectionDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.CREATE] },
  handler: async ({ body }) => {
    assertPublishReady(body, body.status, createDtoRequirednessResolver(CreateFaqSectionDto, body));
    return faqSectionRepository.save(body);
  },
  revalidateTags: FAQ_TAGS,
});
