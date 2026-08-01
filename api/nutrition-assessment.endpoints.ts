import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type {
  CreateNutritionAssessmentDto,
  NutritionAssessment,
  UpdateNutritionAssessmentDto,
} from "../src/common/interfaces/nutrition-assessment.interface";

// Backed by the route handlers under src/app/api/nutrition-assessments.

export const getNutritionAssessmentsEndpoint: Endpoint<{
  query: PaginationQuery & { clientProfileId: string } & Record<string, unknown>;
  returnType: PaginatedResponse<NutritionAssessment>;
}> = { url: "/nutrition-assessments", methodType: MethodType.GET };

export const getNutritionAssessmentByIdEndpoint: Endpoint<{
  params: { id: string };
  returnType: NutritionAssessment;
}> = {
  url: "/nutrition-assessments/:id",
  methodType: MethodType.GET,
};

export const createNutritionAssessmentEndpoint: Endpoint<{
  body: CreateNutritionAssessmentDto;
  returnType: NutritionAssessment;
}> = {
  url: "/nutrition-assessments",
  methodType: MethodType.POST,
};

export const updateNutritionAssessmentEndpoint: Endpoint<{
  params: { id: string };
  body: UpdateNutritionAssessmentDto;
  returnType: NutritionAssessment;
}> = {
  url: "/nutrition-assessments/:id",
  methodType: MethodType.PUT,
};

export const deleteNutritionAssessmentEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/nutrition-assessments/:id",
  methodType: MethodType.DELETE,
};
