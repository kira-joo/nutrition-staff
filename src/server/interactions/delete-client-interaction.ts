import { ForbiddenError } from "@kira-joo/backend-toolkit-core";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";

/** Same rule as editing — a deletable "immutable" audit entry isn't actually immutable, so system-generated interactions can't be removed either. */
export async function deleteClientInteraction(id: string) {
  const existing = await clientInteractionRepository.findOne({ where: { _id: id } });

  if (existing.isSystemGenerated) {
    throw new ForbiddenError("System-generated interactions cannot be deleted.");
  }

  await clientInteractionRepository.softDelete({ where: { _id: id } });
}
