import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { CreateRoleDto } from "src/server/core/authorization/dto/create-role.dto";
import { ListRolesQueryDto } from "src/server/core/authorization/dto/list-roles-query.dto";
import { roleRepository } from "src/server/core/authorization/role.repository";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";

export const GET = createGetRoute({
  query: ListRolesQueryDto,
  auth: { permissions: [AppPermission.ROLE.READ] },
  handler: async ({ query }) => roleRepository.findAllAndCountPublic({ query, relations: ["permissions"] }),
});

export const POST = createPostRoute({
  body: CreateRoleDto,
  auth: { permissions: [AppPermission.ROLE.CREATE] },
  handler: async ({ body }) => roleRepository.save(body),
});
