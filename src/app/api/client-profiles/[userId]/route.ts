import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { attachClientProfile } from "src/server/clients/attach-client-profile";
import { AttachClientProfileDto } from "src/server/clients/dto/attach-client-profile.dto";
import { FindClientByUserParamsDto } from "src/server/clients/dto/find-client-by-user-params.dto";
import { getClientByUserId } from "src/server/clients/get-client-by-user-id";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindClientByUserParamsDto,
  auth: { permissions: [AppPermission.CLIENT.READ_ONE] },
  handler: async ({ params }) => getClientByUserId(params.userId),
});

// Not a PUT/upsert like staff-profiles: attaching a ClientProfile to a User
// that already has one is a real conflict (409), never a silent update —
// see attachClientProfile's own doc comment.
export const POST = createPostRoute({
  params: FindClientByUserParamsDto,
  body: AttachClientProfileDto,
  auth: { permissions: [AppPermission.CLIENT.CREATE] },
  handler: async ({ params, body }) => attachClientProfile(params.userId, body),
});
