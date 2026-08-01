import { staffProfileRepository } from "src/server/staff/staff-profiles.repository";
import { UpsertStaffProfileDto } from "src/server/staff/dto/upsert-staff-profile.dto";

/** Create-if-missing, else update — the frontend doesn't need to know in advance whether a `StaffProfile` already exists for this `userId`. */
export async function upsertStaffProfile(userId: string, body: UpsertStaffProfileDto) {
  const existing = await staffProfileRepository.findOne({ where: { userId }, skipThrowError: true });

  if (existing) {
    return staffProfileRepository.update({ where: { userId } }, body);
  }

  return staffProfileRepository.save({ userId, ...body });
}
