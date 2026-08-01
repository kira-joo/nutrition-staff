import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type {
  ComputeNutritionCalculationInputs,
  ComputeNutritionCalculationResponse,
  CreateNutritionCalculationDto,
  NutritionCalculation,
  UpdateNutritionCalculationDto,
} from "../src/common/interfaces/nutrition-calculation.interface";

// Backed by the route handlers under src/app/api/nutrition-calculations.

/** Stateless — never persists anything. */
export const computeNutritionCalculationEndpoint: Endpoint<{
  body: ComputeNutritionCalculationInputs;
  returnType: ComputeNutritionCalculationResponse;
}> = { url: "/nutrition-calculations/compute", methodType: MethodType.POST };

export const getNutritionCalculationsEndpoint: Endpoint<{
  query: PaginationQuery & { clientProfileId: string } & Record<string, unknown>;
  returnType: PaginatedResponse<NutritionCalculation>;
}> = { url: "/nutrition-calculations", methodType: MethodType.GET };

export const getNutritionCalculationByIdEndpoint: Endpoint<{
  params: { id: string };
  returnType: NutritionCalculation;
}> = { url: "/nutrition-calculations/:id", methodType: MethodType.GET };

export const createNutritionCalculationEndpoint: Endpoint<{
  body: CreateNutritionCalculationDto;
  returnType: NutritionCalculation;
}> = { url: "/nutrition-calculations", methodType: MethodType.POST };

export const updateNutritionCalculationEndpoint: Endpoint<{
  params: { id: string };
  body: UpdateNutritionCalculationDto;
  returnType: NutritionCalculation;
}> = { url: "/nutrition-calculations/:id", methodType: MethodType.PUT };
