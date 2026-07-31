import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { RecipeCategory, RecipeCategoryFormValues } from "../src/common/interfaces/recipe-category.interface";

export const getRecipeCategoriesEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<RecipeCategory>;
}> = { url: "/recipe-categories", methodType: MethodType.GET };

export const getRecipeCategoryByIdEndpoint: Endpoint<{ params: { id: string }; returnType: RecipeCategory }> = {
  url: "/recipe-categories/:id",
  methodType: MethodType.GET,
};

export const createRecipeCategoryEndpoint: Endpoint<{ body: RecipeCategoryFormValues; returnType: RecipeCategory }> = {
  url: "/recipe-categories",
  methodType: MethodType.POST,
};

export const updateRecipeCategoryEndpoint: Endpoint<{
  params: { id: string };
  body: Partial<RecipeCategoryFormValues>;
  returnType: RecipeCategory;
}> = {
  url: "/recipe-categories/:id",
  methodType: MethodType.PUT,
};

export const deleteRecipeCategoryEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/recipe-categories/:id",
  methodType: MethodType.DELETE,
};
