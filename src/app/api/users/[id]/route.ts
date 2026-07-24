import { createDeleteRoute, createGetRoute, createPutRoute } from "@/server/route-factories";
import { FindUserParamsDto } from "@/server/users/dto/find-user-params.dto";
import { UpdateUserDto } from "@/server/users/dto/update-user.dto";
import { userRepository } from "@/server/users/users.repository";

export const GET = createGetRoute({
  params: FindUserParamsDto,
  auth: false,
  handler: async ({ params }) => userRepository.findOne({ where: { _id: params.id } }),
});

export const PUT = createPutRoute({
  params: FindUserParamsDto,
  body: UpdateUserDto,
  auth: false,
  handler: async ({ params, body }) => userRepository.update({ where: { _id: params.id } }, body),
});

export const DELETE = createDeleteRoute({
  params: FindUserParamsDto,
  auth: false,
  handler: async ({ params }) => {
    await userRepository.delete({ where: { _id: params.id } });
  },
});
