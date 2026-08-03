import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { staffProfileRepository } from "src/server/staff/staff-profiles.repository";
import { userRepository } from "src/server/users/users.repository";

/**
 * Deleting the shared identity must not leave an orphaned, still-active
 * StaffProfile/ClientProfile pointing at a `userId` that no longer exists.
 * Both are soft-deleted first — preserving their history for later lookup,
 * consistent with every other CRM/clinical collection's soft-delete-only
 * convention — then the `User` itself is hard-deleted (unchanged from
 * existing behavior; `User` has no soft-delete of its own). Once the
 * `User` is gone, these soft-deleted profiles reference a `userId` that no
 * longer resolves to anything; they're a historical record, not something
 * a future action can "recover" back to active.
 */
export async function deleteUser(userId: string) {
  await clientProfileRepository.softDelete({ where: { userId }, skipThrowError: true });
  await staffProfileRepository.softDelete({ where: { userId }, skipThrowError: true });
  await userRepository.delete({ where: { _id: userId } });
}
