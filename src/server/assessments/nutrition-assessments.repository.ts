import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { NutritionAssessmentModel } from "src/server/assessments/nutrition-assessment.schema";

export const nutritionAssessmentRepository = createMongooseRepository({
  model: NutritionAssessmentModel,
  entityName: EntityName.NUTRITION_ASSESSMENT,
});
