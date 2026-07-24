import { createGetRoute, createPostRoute } from "@/server/route-factories";
import { CreateUserDto } from "@/server/users/dto/create-user.dto";
import { ListUsersQueryDto } from "@/server/users/dto/list-users-query.dto";
import { userRepository } from "@/server/users/users.repository";

export const GET = createGetRoute({
  query: ListUsersQueryDto,
  auth: false,
  handler: async ({ query }) => userRepository.findAllAndCountPublic({ query }),
});

export const POST = createPostRoute({
  body: CreateUserDto,
  auth: false,
  handler: async ({ body }) => userRepository.save(body),
});
