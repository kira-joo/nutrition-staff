import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Recipe } from "../src/common/interfaces/recipe.interface";

// Backed by the multipart-upload-on-submit route handlers under src/app/api/recipes.
// create/update bodies are typed loosely (Record<string, unknown>) — see review.endpoints.ts.

export const getRecipesEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Recipe>;
}> = { url: "/recipes", methodType: MethodType.GET };

export const getRecipeByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Recipe }> = {
  url: "/recipes/:id",
  methodType: MethodType.GET,
};

export const createRecipeEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: Recipe }> = {
  url: "/recipes",
  methodType: MethodType.POST,
};

export const updateRecipeEndpoint: Endpoint<{
  params: { id: string };
  body: Record<string, unknown>;
  returnType: Recipe;
}> = {
  url: "/recipes/:id",
  methodType: MethodType.PUT,
};

export const deleteRecipeEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/recipes/:id",
  methodType: MethodType.DELETE,
};

// Consumed via `downloadRequester` (forces a blob response) rather than
// `useRequesterMutation` — `returnType: Blob` reflects that.
export const exportRecipesPdfEndpoint: Endpoint<{ body: { ids: string[] }; returnType: Blob }> = {
  url: "/recipes/export-pdf",
  methodType: MethodType.POST,
};
