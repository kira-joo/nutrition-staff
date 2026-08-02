import { ProfileType } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { staffProfileRepository } from "src/server/staff/staff-profiles.repository";
import { ListUsersQueryDto } from "src/server/users/dto/list-users-query.dto";
import { userRepository } from "src/server/users/users.repository";

async function userIdSet(rows: { userId: unknown }[]): Promise<Set<string>> {
  return new Set(rows.map((row) => String(row.userId)));
}

/**
 * STAFF_ONLY/CLIENT_ONLY are existence checks on that one profile type,
 * independent of the other — a person who is both staff and a client of the
 * clinic still matches STAFF_ONLY (e.g. "assign to any staff member" combobox
 * usages need exactly this: excluding them because they're also a client
 * would be wrong). Only BOTH/IDENTITY_ONLY are true mutual-exclusive checks,
 * since each is inherently about the combination (both present / neither
 * present) rather than one profile type alone.
 */
function buildProfileTypeWhere(
  profileType: ProfileType,
  clientUserIds: Set<string>,
  staffUserIds: Set<string>
): Record<string, unknown> {
  switch (profileType) {
    case ProfileType.BOTH:
      return { _id: { $in: [...clientUserIds].filter((id) => staffUserIds.has(id)) } };
    case ProfileType.CLIENT_ONLY:
      return { _id: { $in: [...clientUserIds] } };
    case ProfileType.STAFF_ONLY:
      return { _id: { $in: [...staffUserIds] } };
    case ProfileType.IDENTITY_ONLY:
      return { _id: { $nin: [...new Set([...clientUserIds, ...staffUserIds])] } };
  }
}

/**
 * `User` has no stored "is staff"/"is client" field — `hasClientProfile`/
 * `hasStaffProfile` (and the `profileType` filter) are always derived by
 * checking `ClientProfile`/`StaffProfile` for a matching `userId`, never
 * inferred from `roles`.
 */
export async function listUsers(query: ListUsersQueryDto) {
  const { profileType, ...rest } = query;

  let where: Record<string, unknown> | undefined;
  let allClientUserIds: Set<string> | undefined;
  let allStaffUserIds: Set<string> | undefined;

  if (profileType) {
    [allClientUserIds, allStaffUserIds] = await Promise.all([
      clientProfileRepository.findAll({ select: { userId: true } }).then(userIdSet),
      staffProfileRepository.findAll({ select: { userId: true } }).then(userIdSet),
    ]);
    where = buildProfileTypeWhere(profileType, allClientUserIds, allStaffUserIds);
  }

  const result = await userRepository.findAllAndCountPublic({ query: rest, where, relations: ["roles"] });

  const pageUserIds = result.data.map((user) => String(user._id));
  const [pageClientIds, pageStaffIds] =
    allClientUserIds && allStaffUserIds
      ? [allClientUserIds, allStaffUserIds]
      : await Promise.all([
          clientProfileRepository
            .findAll({ where: { userId: { $in: pageUserIds } }, select: { userId: true } })
            .then(userIdSet),
          staffProfileRepository
            .findAll({ where: { userId: { $in: pageUserIds } }, select: { userId: true } })
            .then(userIdSet),
        ]);

  return {
    ...result,
    data: result.data.map((user) => ({
      ...user,
      hasClientProfile: pageClientIds.has(String(user._id)),
      hasStaffProfile: pageStaffIds.has(String(user._id)),
    })),
  };
}
