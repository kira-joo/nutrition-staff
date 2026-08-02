import { ClientLifecycle, InteractionType } from "src/common/enums";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";

/** Called from updateClient whenever a lifecycle change is actually detected — this is the entire mechanism satisfying "auto-logged lifecycle history" (see the plan's decision to consolidate lifecycle history into the interaction timeline rather than a separate collection). */
export async function logLifecycleChangeInteraction(
  clientProfileId: string,
  from: ClientLifecycle,
  to: ClientLifecycle,
  actingUserId: string
) {
  await clientInteractionRepository.save({
    clientProfileId,
    type: InteractionType.LIFECYCLE_CHANGE,
    summary: `Lifecycle changed from ${from} to ${to}`,
    happenedAt: new Date(),
    createdByUserId: actingUserId,
    isSystemGenerated: true,
  });
}
