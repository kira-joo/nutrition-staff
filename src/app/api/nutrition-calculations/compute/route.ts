import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { ComputeNutritionCalculationDto } from "src/server/nutrition-calculations/dto/compute-nutrition-calculation.dto";
import { runNutritionCalculation } from "src/server/nutrition-calculations/engine/run-nutrition-calculation";

export const dynamic = "force-dynamic";

/**
 * Stateless — never persists anything. The frontend holds the full
 * response (echoing `inputs` back alongside `results`/`assumptions`/
 * `engineVersion`/`calculatedAt`) so a later "Save"/"Assign to Client"
 * action can persist that exact snapshot without ever recomputing it.
 */
export const POST = createPostRoute({
  body: ComputeNutritionCalculationDto,
  auth: { permissions: [AppPermission.NUTRITION_CALCULATION.CREATE] },
  handler: async ({ body }) => {
    const { engineVersion, calculatedAt, results, assumptions } = runNutritionCalculation(body);
    return { inputs: body, engineVersion, calculatedAt, results, assumptions };
  },
});
