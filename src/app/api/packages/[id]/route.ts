import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { FindPackageParamsDto } from "src/server/packages/dto/find-package-params.dto";
import { UpdatePackageDto } from "src/server/packages/dto/update-package.dto";
import { packageRepository } from "src/server/packages/packages.repository";

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
    assertPublishReady({ ...existing, ...body }, nextStatus);
    return packageRepository.update({ where: { _id: params.id } }, body);
  },
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
});
