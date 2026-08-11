import { createDtoRequirednessResolver } from "@kira-joo/backend-toolkit-core";
import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { PACKAGES_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreatePackageDto } from "src/server/packages/dto/create-package.dto";
import { ListPackagesQueryDto } from "src/server/packages/dto/list-packages-query.dto";
import { packageRepository } from "src/server/packages/packages.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListPackagesQueryDto,
  auth: { permissions: [AppPermission.PACKAGE.READ] },
  handler: async ({ query }) => packageRepository.findAllAndCountPublic({ query }),
});

export const POST = createPostRoute({
  body: CreatePackageDto,
  auth: { permissions: [AppPermission.PACKAGE.CREATE] },
  handler: async ({ body }) => {
    assertPublishReady(body, body.status, createDtoRequirednessResolver(CreatePackageDto, body));
    return packageRepository.save(body);
  },
  revalidateTags: PACKAGES_TAGS,
});
