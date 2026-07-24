import { createDeleteRoute, createGetRoute, createPutRoute } from "@/server/route-factories";
import { FindUserParamsDto } from "@/server/users/dto/find-user-params.dto";
import { UpdateUserDto } from "@/server/users/dto/update-user.dto";
import { userRepository } from "@/server/users/users.repository";
import { AppPermission } from "@/server/authorization/authorization-registry";

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
