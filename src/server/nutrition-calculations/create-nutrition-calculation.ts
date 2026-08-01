import { BadRequestError, ConflictError } from "@kira-joo/backend-toolkit-core";
import { ClientLifecycle, CalculationType } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { CreateNutritionCalculationDto } from "src/server/nutrition-calculations/dto/create-nutrition-calculation.dto";
import { nutritionCalculationRepository } from "src/server/nutrition-calculations/nutrition-calculations.repository";

/**
 * Persists an already-computed snapshot exactly as given — never re-runs
 * the engine. Two paths to a `clientProfileId`:
 * - client-based flow: `clientProfileId` is already known, passed straight
 *   through.
 * - standalone "Assign to Client" flow: `targetUserId` is a User the
 *   doctor picked; if they have no `ClientProfile` yet, one is created
 *   (lifecycle LEAD) only when `createClientProfileIfMissing` was
 *   explicitly checked — otherwise this throws rather than silently
 *   creating one.
 */
export async function createNutritionCalculation(body: CreateNutritionCalculationDto, calculatedByUserId: string) {
  let clientProfileId = body.clientProfileId;
  let assignedAt: Date | undefined;

  if (!clientProfileId) {
    if (!body.targetUserId) {
      throw new BadRequestError("Either clientProfileId or targetUserId is required");
    }

    let profile = await clientProfileRepository.findOne({ where: { userId: body.targetUserId }, skipThrowError: true });

    if (!profile) {
      if (!body.createClientProfileIfMissing) {
        throw new ConflictError("This person has no client profile yet — confirm creating one to assign this calculation.");
      }
      profile = await clientProfileRepository.save({
        userId: body.targetUserId,
        lifecycle: ClientLifecycle.LEAD,
        tags: [],
      });
    }

    clientProfileId = String(profile._id);
    assignedAt = new Date();
  }

  return nutritionCalculationRepository.save({
    clientProfileId,
    assessmentId: body.assessmentId,
    measurementId: body.measurementId,
    type: CalculationType.NUTRITION_WORKSPACE,
    engineVersion: body.engineVersion,
    inputs: body.inputs,
    results: body.results,
    assumptions: body.assumptions ?? [],
    calculatedAt: body.calculatedAt,
    calculatedByUserId,
    assignedAt,
    notes: body.notes,
  });
}
