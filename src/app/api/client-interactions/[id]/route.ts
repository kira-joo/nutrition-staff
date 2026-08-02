import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { deleteClientInteraction } from "src/server/interactions/delete-client-interaction";
import { FindClientInteractionParamsDto } from "src/server/interactions/dto/find-client-interaction-params.dto";
import { UpdateClientInteractionDto } from "src/server/interactions/dto/update-client-interaction.dto";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";
import { updateClientInteraction } from "src/server/interactions/update-client-interaction";

export const GET = createGetRoute({
  params: FindClientInteractionParamsDto,
  auth: { permissions: [AppPermission.CLIENT_INTERACTION.READ_ONE] },
  handler: async ({ params }) =>
    clientInteractionRepository.findOne({ where: { _id: params.id }, relations: ["createdByUserId"] }),
});

export const PUT = createPutRoute({
  params: FindClientInteractionParamsDto,
  body: UpdateClientInteractionDto,
  auth: { permissions: [AppPermission.CLIENT_INTERACTION.UPDATE] },
  handler: async ({ params, body }) => updateClientInteraction(params.id, body),
});

export const DELETE = createDeleteRoute({
  params: FindClientInteractionParamsDto,
  auth: { permissions: [AppPermission.CLIENT_INTERACTION.DELETE] },
  handler: async ({ params }) => {
    await deleteClientInteraction(params.id);
  },
});
