import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { FindClientParamsDto } from "src/server/clients/dto/find-client-params.dto";
import { UpdateClientDto } from "src/server/clients/dto/update-client.dto";
import { updateClient } from "src/server/clients/update-client";

export const GET = createGetRoute({
  params: FindClientParamsDto,
  auth: { permissions: [AppPermission.CLIENT.READ_ONE] },
  handler: async ({ params }) =>
    clientProfileRepository.findOne({ where: { _id: params.id }, relations: ["userId", "assignedToUserId"] }),
});

export const PUT = createPutRoute({
  params: FindClientParamsDto,
  body: UpdateClientDto,
  auth: { permissions: [AppPermission.CLIENT.UPDATE] },
  handler: async ({ params, body, user }) => {
    const clientProfile = await clientProfileRepository.findOne({ where: { _id: params.id }, lean: false });
    return updateClient(params.id, String(clientProfile.userId), body, user._id);
  },
});

export const DELETE = createDeleteRoute({
  params: FindClientParamsDto,
  auth: { permissions: [AppPermission.CLIENT.DELETE] },
  handler: async ({ params }) => {
    await clientProfileRepository.softDelete({ where: { _id: params.id } });
  },
});
