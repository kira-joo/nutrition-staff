import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { FindNutritionAssessmentParamsDto } from "src/server/assessments/dto/find-nutrition-assessment-params.dto";
import { UpdateNutritionAssessmentDto } from "src/server/assessments/dto/update-nutrition-assessment.dto";
import { nutritionAssessmentRepository } from "src/server/assessments/nutrition-assessments.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindNutritionAssessmentParamsDto,
  auth: { permissions: [AppPermission.NUTRITION_ASSESSMENT.READ_ONE] },
  handler: async ({ params }) =>
    nutritionAssessmentRepository.findOne({ where: { _id: params.id }, relations: ["assessedByUserId"] }),
});

export const PUT = createPutRoute({
  params: FindNutritionAssessmentParamsDto,
  body: UpdateNutritionAssessmentDto,
  auth: { permissions: [AppPermission.NUTRITION_ASSESSMENT.UPDATE] },
  handler: async ({ params, body }) => nutritionAssessmentRepository.update({ where: { _id: params.id } }, body),
});

export const DELETE = createDeleteRoute({
  params: FindNutritionAssessmentParamsDto,
  auth: { permissions: [AppPermission.NUTRITION_ASSESSMENT.DELETE] },
  handler: async ({ params }) => {
    await nutritionAssessmentRepository.softDelete({ where: { _id: params.id } });
  },
});
