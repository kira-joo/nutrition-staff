import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateFaq } from "src/server/core/revalidation/revalidate-entity";
import { FindFaqItemParamsDto } from "src/server/faq-items/dto/find-faq-item-params.dto";
import { UpdateFaqItemDto } from "src/server/faq-items/dto/update-faq-item.dto";
import { faqItemRepository } from "src/server/faq-items/faq-items.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindFaqItemParamsDto,
  auth: { permissions: [AppPermission.FAQ_ITEM.READ_ONE] },
  handler: async ({ params }) => faqItemRepository.findOne({ where: { _id: params.id }, relations: ["section"] }),
});

export const PUT = createPutRoute({
  params: FindFaqItemParamsDto,
  body: UpdateFaqItemDto,
  auth: { permissions: [AppPermission.FAQ_ITEM.UPDATE] },
  handler: async ({ params, body }) => {
    const existing = await faqItemRepository.findOne({ where: { _id: params.id } });
    const nextStatus = body.status ?? existing.status;
    assertPublishReady({ ...existing, ...body }, nextStatus);
    const updated = await faqItemRepository.update({ where: { _id: params.id } }, body);
    await revalidateFaq();
    return updated;
  },
});

export const DELETE = createDeleteRoute({
  params: FindFaqItemParamsDto,
  auth: { permissions: [AppPermission.FAQ_ITEM.DELETE] },
  handler: async ({ params }) => {
    await faqItemRepository.softDelete({ where: { _id: params.id } });
    await revalidateFaq();
  },
});
