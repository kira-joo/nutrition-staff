import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { createGetRoute } from "@/server/route-factories";
import { permissionRepository } from "@/server/authorization/permission.repository";
import { AppPermission } from "@/server/authorization/authorization-registry";

export const GET = createGetRoute({
  query: BaseFindQueryDto,
  auth: { permissions: [AppPermission.PERMISSION.READ] },
  handler: async ({ query }) => permissionRepository.findAllAndCountPublic({ query }),
});
