import { AssetKind, recipeImagePolicy, type AssetFieldConfig } from "src/server/core/assets";

export const RECIPE_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "image", kind: AssetKind.IMAGE, policy: recipeImagePolicy },
];

export const RECIPE_ASSET_FOLDER = "nutrition/recipes";
