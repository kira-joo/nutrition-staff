import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { CreateNutritionCalculationDto } from "src/server/nutrition-calculations/dto/create-nutrition-calculation.dto";
import { ListNutritionCalculationsQueryDto } from "src/server/nutrition-calculations/dto/list-nutrition-calculations-query.dto";
import { createNutritionCalculation } from "src/server/nutrition-calculations/create-nutrition-calculation";
import { nutritionCalculationRepository } from "src/server/nutrition-calculations/nutrition-calculations.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListNutritionCalculationsQueryDto,
  auth: { permissions: [AppPermission.NUTRITION_CALCULATION.READ] },
  handler: async ({ query }) =>
    nutritionCalculationRepository.findAllAndCountPublic({ query, relations: ["calculatedByUserId"] }),
});

export const POST = createPostRoute({
  body: CreateNutritionCalculationDto,
  auth: { permissions: [AppPermission.NUTRITION_CALCULATION.CREATE] },
  handler: async ({ body, user }) => createNutritionCalculation(body, user._id),
});
