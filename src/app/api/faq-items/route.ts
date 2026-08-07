import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { FAQ_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreateFaqItemDto } from "src/server/faq-items/dto/create-faq-item.dto";
import { ListFaqItemsQueryDto } from "src/server/faq-items/dto/list-faq-items-query.dto";
import { faqItemRepository } from "src/server/faq-items/faq-items.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListFaqItemsQueryDto,
  auth: { permissions: [AppPermission.FAQ_ITEM.READ] },
  handler: async ({ query }) => faqItemRepository.findAllAndCountPublic({ query, relations: ["section"] }),
});

export const POST = createPostRoute({
  body: CreateFaqItemDto,
  auth: { permissions: [AppPermission.FAQ_ITEM.CREATE] },
  handler: async ({ body }) => {
    assertPublishReady(body, body.status);
    return faqItemRepository.save(body);
  },
  revalidateTags: FAQ_TAGS,
});
