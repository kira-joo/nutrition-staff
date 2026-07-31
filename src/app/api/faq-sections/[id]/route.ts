import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { FindFaqSectionParamsDto } from "src/server/faq-sections/dto/find-faq-section-params.dto";
import { UpdateFaqSectionDto } from "src/server/faq-sections/dto/update-faq-section.dto";
import { faqSectionRepository } from "src/server/faq-sections/faq-sections.repository";

export const GET = createGetRoute({
  params: FindFaqSectionParamsDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.READ_ONE] },
  handler: async ({ params }) => faqSectionRepository.findOne({ where: { _id: params.id } }),
});

export const PUT = createPutRoute({
  params: FindFaqSectionParamsDto,
  body: UpdateFaqSectionDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.UPDATE] },
  handler: async ({ params, body }) => {
    const existing = await faqSectionRepository.findOne({ where: { _id: params.id } });
    const nextStatus = body.status ?? existing.status;
    assertPublishReady({ ...existing, ...body }, nextStatus);
    return faqSectionRepository.update({ where: { _id: params.id } }, body);
  },
});

export const DELETE = createDeleteRoute({
  params: FindFaqSectionParamsDto,
  auth: { permissions: [AppPermission.FAQ_SECTION.DELETE] },
  handler: async ({ params }) => {
    await faqSectionRepository.softDelete({ where: { _id: params.id } });
  },
});
