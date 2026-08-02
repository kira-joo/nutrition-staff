import { InteractionType } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { CreateClientInteractionDto } from "src/server/interactions/dto/create-client-interaction.dto";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";

/** Real, "we spoke" contact — a NOTE is an internal record, not contact, so it doesn't move `lastContactedAt`; neither does the system-generated LIFECYCLE_CHANGE (never created through this path anyway). */
const CONTACT_TYPES = new Set<InteractionType>([
  InteractionType.CALL,
  InteractionType.WHATSAPP,
  InteractionType.MESSAGE,
  InteractionType.EMAIL,
  InteractionType.MEETING,
  InteractionType.OTHER,
]);

export async function createClientInteraction(body: CreateClientInteractionDto, createdByUserId: string) {
  const happenedAt = body.happenedAt ?? new Date();

  const interaction = await clientInteractionRepository.save({
    ...body,
    happenedAt,
    createdByUserId,
    isSystemGenerated: false,
  });

  const isContact = CONTACT_TYPES.has(body.type);
  if (isContact || body.nextFollowUpAt) {
    const profile = await clientProfileRepository.findOne({ where: { _id: body.clientProfileId } });
    const profilePatch: Record<string, unknown> = {};

    // Backdating a contact from before the current lastContactedAt shouldn't regress it.
    if (isContact && (!profile.lastContactedAt || happenedAt > new Date(profile.lastContactedAt))) {
      profilePatch.lastContactedAt = happenedAt;
    }

    if (body.nextFollowUpAt) {
      profilePatch.nextFollowUpAt = body.nextFollowUpAt;
    }

    if (Object.keys(profilePatch).length > 0) {
      await clientProfileRepository.update({ where: { _id: body.clientProfileId } }, profilePatch);
    }
  }

  return interaction;
}
