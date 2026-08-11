import { createDtoRequirednessResolver } from "@kira-joo/backend-toolkit-core";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { assertPublishReady } from "src/server/core/publishing";
import { PACKAGES_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { CreatePackageDto } from "src/server/packages/dto/create-package.dto";
import { FindPackageParamsDto } from "src/server/packages/dto/find-package-params.dto";
import { UpdatePackageDto } from "src/server/packages/dto/update-package.dto";
import { packageRepository } from "src/server/packages/packages.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindPackageParamsDto,
  auth: { permissions: [AppPermission.PACKAGE.READ_ONE] },
  handler: async ({ params }) => packageRepository.findOne({ where: { _id: params.id } }),
});

export const PUT = createPutRoute({
  params: FindPackageParamsDto,
  body: UpdatePackageDto,
  auth: { permissions: [AppPermission.PACKAGE.UPDATE] },
  handler: async ({ params, body }) => {
    const existing = await packageRepository.findOne({ where: { _id: params.id } });
    const nextStatus = body.status ?? existing.status;
    const nextEntity = { ...existing, ...body };
    assertPublishReady(nextEntity, nextStatus, createDtoRequirednessResolver(CreatePackageDto, nextEntity));
    return packageRepository.update({ where: { _id: params.id } }, body);
  },
  revalidateTags: PACKAGES_TAGS,
});

// Hard delete — Package has no soft delete (see the schema's own note: a
// tiny, fixed-size collection, not user-generated content). No assets to
// clean up either, since Package has none.
export const DELETE = createDeleteRoute({
  params: FindPackageParamsDto,
  auth: { permissions: [AppPermission.PACKAGE.DELETE] },
  handler: async ({ params }) => {
    await packageRepository.delete({ where: { _id: params.id } });
  },
  revalidateTags: PACKAGES_TAGS,
});
