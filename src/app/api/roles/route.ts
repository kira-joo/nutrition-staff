import { createGetRoute, createPostRoute } from "@/server/route-factories";
import { roleRepository } from "@/server/authorization/role.repository";
import { AppPermission } from "@/server/authorization/authorization-registry";
import { CreateRoleDto } from "@/server/authorization/dto/create-role.dto";
import { ListRolesQueryDto } from "@/server/authorization/dto/list-roles-query.dto";

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
