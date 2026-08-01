import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { FindNutritionCalculationParamsDto } from "src/server/nutrition-calculations/dto/find-nutrition-calculation-params.dto";
import { UpdateNutritionCalculationDto } from "src/server/nutrition-calculations/dto/update-nutrition-calculation.dto";
import { nutritionCalculationRepository } from "src/server/nutrition-calculations/nutrition-calculations.repository";

export const GET = createGetRoute({
  params: FindNutritionCalculationParamsDto,
  auth: { permissions: [AppPermission.NUTRITION_CALCULATION.READ_ONE] },
  handler: async ({ params }) =>
    nutritionCalculationRepository.findOne({ where: { _id: params.id }, relations: ["calculatedByUserId"] }),
});

/** Only `notes` is ever accepted here — see UpdateNutritionCalculationDto. */
export const PUT = createPutRoute({
  params: FindNutritionCalculationParamsDto,
  body: UpdateNutritionCalculationDto,
  auth: { permissions: [AppPermission.NUTRITION_CALCULATION.UPDATE] },
  handler: async ({ params, body }) => nutritionCalculationRepository.update({ where: { _id: params.id } }, body),
});

export const DELETE = createDeleteRoute({
  params: FindNutritionCalculationParamsDto,
  auth: { permissions: [AppPermission.NUTRITION_CALCULATION.DELETE] },
  handler: async ({ params }) => {
    await nutritionCalculationRepository.softDelete({ where: { _id: params.id } });
  },
});
