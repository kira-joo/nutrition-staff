import { createDeleteRoute, createGetRoute, createPutRoute } from "@/server/route-factories";
import { FindRoleParamsDto } from "@/server/authorization/dto/find-role-params.dto";
import { UpdateRoleDto } from "@/server/authorization/dto/update-role.dto";
import { roleRepository } from "@/server/authorization/role.repository";
import { AppPermission } from "@/server/authorization/authorization-registry";

export const GET = createGetRoute({
  params: FindRoleParamsDto,
  auth: { permissions: [AppPermission.ROLE.READ_ONE] },
  handler: async ({ params }) => roleRepository.findOne({ where: { _id: params.id }, relations: ["permissions"] }),
});

export const PUT = createPutRoute({
  params: FindRoleParamsDto,
  body: UpdateRoleDto,
  auth: { permissions: [AppPermission.ROLE.UPDATE] },
  handler: async ({ params, body }) => roleRepository.update({ where: { _id: params.id } }, body),
});

export const DELETE = createDeleteRoute({
  params: FindRoleParamsDto,
  auth: { permissions: [AppPermission.ROLE.DELETE] },
  handler: async ({ params }) => {
    await roleRepository.delete({ where: { _id: params.id } });
  },
});
