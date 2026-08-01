import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { createNutritionAssessment } from "src/server/assessments/create-nutrition-assessment";
import { CreateNutritionAssessmentDto } from "src/server/assessments/dto/create-nutrition-assessment.dto";
import { ListNutritionAssessmentsQueryDto } from "src/server/assessments/dto/list-nutrition-assessments-query.dto";
import { nutritionAssessmentRepository } from "src/server/assessments/nutrition-assessments.repository";

export const GET = createGetRoute({
  query: ListNutritionAssessmentsQueryDto,
  auth: { permissions: [AppPermission.NUTRITION_ASSESSMENT.READ] },
  handler: async ({ query }) =>
    nutritionAssessmentRepository.findAllAndCountPublic({ query, relations: ["assessedByUserId"] }),
});

export const POST = createPostRoute({
  body: CreateNutritionAssessmentDto,
  auth: { permissions: [AppPermission.NUTRITION_ASSESSMENT.CREATE] },
  handler: async ({ body, user }) => createNutritionAssessment(body, user._id),
});
