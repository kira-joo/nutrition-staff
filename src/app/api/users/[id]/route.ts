import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { FindUserParamsDto } from "src/server/users/dto/find-user-params.dto";
import { UpdateUserDto } from "src/server/users/dto/update-user.dto";
import { userRepository } from "src/server/users/users.repository";

export const GET = createGetRoute({
  params: FindUserParamsDto,
  auth: { permissions: [AppPermission.USER.READ_ONE] },
  handler: async ({ params }) => userRepository.findOne({ where: { _id: params.id }, relations: ["roles"] }),
});

export const PUT = createPutRoute({
  params: FindUserParamsDto,
  body: UpdateUserDto,
  auth: { permissions: [AppPermission.USER.UPDATE] },
  handler: async ({ params, body }) => userRepository.update({ where: { _id: params.id } }, body),
});

export const DELETE = createDeleteRoute({
  params: FindUserParamsDto,
  auth: { permissions: [AppPermission.USER.DELETE] },
  handler: async ({ params }) => {
    await userRepository.delete({ where: { _id: params.id } });
  },
});
