import { ForbiddenError } from "@kira-joo/backend-toolkit-core";
import { UpdateClientInteractionDto } from "src/server/interactions/dto/update-client-interaction.dto";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";

/** System-generated interactions (auto-logged lifecycle changes) are never editable — the whole point is an untamperable lifecycle audit trail. */
export async function updateClientInteraction(id: string, body: UpdateClientInteractionDto) {
  const existing = await clientInteractionRepository.findOne({ where: { _id: id } });

  if (existing.isSystemGenerated) {
    throw new ForbiddenError("System-generated interactions cannot be edited.");
  }

  return clientInteractionRepository.update({ where: { _id: id } }, body);
}
