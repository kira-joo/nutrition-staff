import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { createClient } from "src/server/clients/create-client";
import { CreateClientDto } from "src/server/clients/dto/create-client.dto";
import { ListClientsQueryDto } from "src/server/clients/dto/list-clients-query.dto";
import { listClients } from "src/server/clients/list-clients";

export const GET = createGetRoute({
  query: ListClientsQueryDto,
  auth: { permissions: [AppPermission.CLIENT.READ] },
  handler: async ({ query }) => listClients(query),
});

export const POST = createPostRoute({
  body: CreateClientDto,
  auth: { permissions: [AppPermission.CLIENT.CREATE] },
  handler: async ({ body }) => createClient(body),
});
