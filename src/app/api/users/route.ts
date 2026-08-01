import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { CreateUserDto } from "src/server/users/dto/create-user.dto";
import { ListUsersQueryDto } from "src/server/users/dto/list-users-query.dto";
import { listUsers } from "src/server/users/list-users";
import { userRepository } from "src/server/users/users.repository";

export const GET = createGetRoute({
  query: ListUsersQueryDto,
  auth: { permissions: [AppPermission.USER.READ] },
  handler: async ({ query }) => listUsers(query),
});

export const POST = createPostRoute({
  body: CreateUserDto,
  auth: { permissions: [AppPermission.USER.CREATE] },
  handler: async ({ body }) => userRepository.save(body),
});
