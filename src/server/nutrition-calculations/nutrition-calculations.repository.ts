import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { NutritionCalculationModel } from "src/server/nutrition-calculations/nutrition-calculation.schema";

export const nutritionCalculationRepository = createMongooseRepository({
  model: NutritionCalculationModel,
  entityName: EntityName.NUTRITION_CALCULATION,
});
