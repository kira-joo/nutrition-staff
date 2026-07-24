import { createGetRoute, createPostRoute } from "@/server/route-factories";
import { CreateUserDto } from "@/server/users/dto/create-user.dto";
import { ListUsersQueryDto } from "@/server/users/dto/list-users-query.dto";
import { userRepository } from "@/server/users/users.repository";
import { AppPermission } from "@/server/authorization/authorization-registry";

export const GET = createGetRoute({
  query: ListUsersQueryDto,
  auth: { permissions: [AppPermission.USER.READ] },
  handler: async ({ query }) => userRepository.findAllAndCountPublic({ query, relations: ["roles"] }),
});

export const POST = createPostRoute({
  body: CreateUserDto,
  auth: { permissions: [AppPermission.USER.CREATE] },
  handler: async ({ body }) => userRepository.save(body),
});
