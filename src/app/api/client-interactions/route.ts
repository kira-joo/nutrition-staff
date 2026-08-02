import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { createClientInteraction } from "src/server/interactions/create-client-interaction";
import { CreateClientInteractionDto } from "src/server/interactions/dto/create-client-interaction.dto";
import { ListClientInteractionsQueryDto } from "src/server/interactions/dto/list-client-interactions-query.dto";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";

export const GET = createGetRoute({
  query: ListClientInteractionsQueryDto,
  auth: { permissions: [AppPermission.CLIENT_INTERACTION.READ] },
  handler: async ({ query }) =>
    clientInteractionRepository.findAllAndCountPublic({ query, relations: ["createdByUserId"] }),
});

export const POST = createPostRoute({
  body: CreateClientInteractionDto,
  auth: { permissions: [AppPermission.CLIENT_INTERACTION.CREATE] },
  handler: async ({ body, user }) => createClientInteraction(body, user._id),
});
