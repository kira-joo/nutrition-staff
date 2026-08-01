import { UpdateClientDto } from "src/server/clients/dto/update-client.dto";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { userRepository } from "src/server/users/users.repository";

const USER_FIELDS = ["name", "phone", "email"] as const;

/**
 * `UpdateClientDto` spans both `User` (identity: name/phone/email) and
 * `ClientProfile` (everything else) — split the incoming patch and write
 * each half to its own collection. Not a real transaction, same rationale
 * as `createClient`.
 */
export async function updateClient(clientProfileId: string, userId: string, body: UpdateClientDto) {
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

  if (Object.keys(userPatch).length > 0) {
    await userRepository.update({ where: { _id: userId } }, userPatch);
  }

  if (Object.keys(profilePatch).length > 0) {
    await clientProfileRepository.update({ where: { _id: clientProfileId } }, profilePatch);
  }

  return clientProfileRepository.findOne({
    where: { _id: clientProfileId },
    relations: ["userId", "assignedToUserId"],
  });
}
