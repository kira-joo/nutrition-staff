import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { RecipeFoodGroup, RecipeFoodGroupFormValues } from "../src/common/interfaces/recipe-food-group.interface";

export const getRecipeFoodGroupsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<RecipeFoodGroup>;
}> = { url: "/recipe-food-groups", methodType: MethodType.GET };

export const getRecipeFoodGroupByIdEndpoint: Endpoint<{ params: { id: string }; returnType: RecipeFoodGroup }> = {
  url: "/recipe-food-groups/:id",
  methodType: MethodType.GET,
};

export const createRecipeFoodGroupEndpoint: Endpoint<{
  body: RecipeFoodGroupFormValues;
  returnType: RecipeFoodGroup;
}> = {
  url: "/recipe-food-groups",
  methodType: MethodType.POST,
};

export const updateRecipeFoodGroupEndpoint: Endpoint<{
  params: { id: string };
  body: Partial<RecipeFoodGroupFormValues>;
  returnType: RecipeFoodGroup;
}> = {
  url: "/recipe-food-groups/:id",
  methodType: MethodType.PUT,
};

export const deleteRecipeFoodGroupEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/recipe-food-groups/:id",
  methodType: MethodType.DELETE,
};
