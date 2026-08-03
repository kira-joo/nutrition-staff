import { clientProfileRepository } from "src/server/clients/client-profiles.repository";

/** Looks up the (at most one) active `ClientProfile` for a given `userId` — `null` when this identity isn't a client. */
export async function getClientByUserId(userId: string) {
  return clientProfileRepository.findOne({
    where: { userId },
    relations: ["userId", "assignedToUserId"],
    skipThrowError: true,
  });
}
