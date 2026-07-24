import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { createGetRoute } from "@/server/route-factories";
import { roleRepository } from "@/server/authorization/role.repository";
import { AppPermission } from "@/server/authorization/authorization-registry";

export const GET = createGetRoute({
  query: BaseFindQueryDto,
  auth: { permissions: [AppPermission.ROLE.READ] },
  handler: async ({ query }) => roleRepository.findAllNoCountPublic({ where: { isActive: true }, query }),
});
