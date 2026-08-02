import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { FindStaffProfileParamsDto } from "src/server/staff/dto/find-staff-profile-params.dto";
import { UpsertStaffProfileDto } from "src/server/staff/dto/upsert-staff-profile.dto";
import { staffProfileRepository } from "src/server/staff/staff-profiles.repository";
import { upsertStaffProfile } from "src/server/staff/upsert-staff-profile";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindStaffProfileParamsDto,
  auth: { permissions: [AppPermission.STAFF.READ_ONE] },
  handler: async ({ params }) =>
    staffProfileRepository.findOne({ where: { userId: params.userId }, skipThrowError: true }),
});

export const PUT = createPutRoute({
  params: FindStaffProfileParamsDto,
  body: UpsertStaffProfileDto,
  auth: { permissions: [AppPermission.STAFF.UPDATE] },
  handler: async ({ params, body }) => upsertStaffProfile(params.userId, body),
});
