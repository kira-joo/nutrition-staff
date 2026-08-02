import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { FindRoleParamsDto } from "src/server/core/authorization/dto/find-role-params.dto";
import { UpdateRoleDto } from "src/server/core/authorization/dto/update-role.dto";
import { roleRepository } from "src/server/core/authorization/role.repository";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

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
