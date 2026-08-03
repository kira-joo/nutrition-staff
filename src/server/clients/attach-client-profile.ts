import { ConflictError } from "@kira-joo/backend-toolkit-core";
import { ClientLifecycle } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { AttachClientProfileDto } from "src/server/clients/dto/attach-client-profile.dto";
import { userRepository } from "src/server/users/users.repository";

/**
 * Attaches a `ClientProfile` to an existing `User` — reusing their identity
 * rather than creating a second `User`, the correct fix for "this email
 * already belongs to someone." Never a blind upsert (unlike
 * `upsertStaffProfile`): a `ClientProfile` already existing is a real
 * conflict, not something to silently overwrite, since attaching sets
 * fresh values (`lifecycle: LEAD` by default) that would clobber a real
 * client's current state.
 *
 * A soft-deleted `ClientProfile` for this user is recovered and updated
 * rather than left orphaned under a fresh duplicate.
 */
export async function attachClientProfile(userId: string, body: AttachClientProfileDto) {
  await userRepository.findOne({ where: { _id: userId } }); // throws NotFoundError if the User doesn't exist

  const active = await clientProfileRepository.findOne({ where: { userId }, skipThrowError: true });
  if (active) {
    throw new ConflictError("This user already has a client profile.", { clientProfileId: String(active._id) });
  }

  const profilePatch = { ...body, lifecycle: body.lifecycle ?? ClientLifecycle.LEAD, tags: body.tags ?? [] };

  const softDeleted = await clientProfileRepository.findOne({ where: { userId }, onlyDeleted: true, skipThrowError: true });
  if (softDeleted) {
    await clientProfileRepository.restore({ where: { userId } });
    return clientProfileRepository.update({ where: { userId } }, profilePatch);
  }

  return clientProfileRepository.save({ userId, ...profilePatch });
}
