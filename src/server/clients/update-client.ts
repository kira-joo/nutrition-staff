import { ClientLifecycle } from "src/common/enums";
import { UpdateClientDto } from "src/server/clients/dto/update-client.dto";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { logLifecycleChangeInteraction } from "src/server/interactions/log-lifecycle-change-interaction";
import { userRepository } from "src/server/users/users.repository";

const USER_FIELDS = ["name", "phone", "email"] as const;

/**
 * `UpdateClientDto` spans both `User` (identity: name/phone/email) and
 * `ClientProfile` (everything else) — split the incoming patch and write
 * each half to its own collection. Not a real transaction, same rationale
 * as `createClient`. `actingUserId` is the authenticated staff member
 * performing this update — distinct from `userId` (the client's own linked
 * identity) — needed to attribute an auto-logged lifecycle-change
 * interaction to whoever actually made the change.
 */
export async function updateClient(clientProfileId: string, userId: string, body: UpdateClientDto, actingUserId: string) {
  const userPatch: Partial<Pick<UpdateClientDto, "name" | "phone" | "email">> = {};
  const profilePatch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if ((USER_FIELDS as readonly string[]).includes(key)) {
      (userPatch as Record<string, unknown>)[key] = value;
    } else {
      profilePatch[key] = value;
    }
  }

  let lifecycleChange: { from: ClientLifecycle; to: ClientLifecycle } | undefined;
  if (body.lifecycle) {
    const current = await clientProfileRepository.findOne({ where: { _id: clientProfileId } });
    if (current.lifecycle !== body.lifecycle) {
      lifecycleChange = { from: current.lifecycle, to: body.lifecycle };
    }
  }

  if (Object.keys(userPatch).length > 0) {
    await userRepository.update({ where: { _id: userId } }, userPatch);
  }

  if (Object.keys(profilePatch).length > 0) {
    await clientProfileRepository.update({ where: { _id: clientProfileId } }, profilePatch);
  }

  if (lifecycleChange) {
    await logLifecycleChangeInteraction(clientProfileId, lifecycleChange.from, lifecycleChange.to, actingUserId);
  }

  return clientProfileRepository.findOne({
    where: { _id: clientProfileId },
    relations: ["userId", "assignedToUserId"],
  });
}
