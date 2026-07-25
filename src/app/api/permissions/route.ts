import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { permissionRepository } from "src/server/core/authorization/permission.repository";
import { createGetRoute } from "src/server/core/route-factories";

export const GET = createGetRoute({
  query: BaseFindQueryDto,
  auth: { permissions: [AppPermission.PERMISSION.READ] },
  handler: async ({ query }) => permissionRepository.findAllAndCountPublic({ query }),
});
