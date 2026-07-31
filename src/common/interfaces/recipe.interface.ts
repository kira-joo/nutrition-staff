import type { ImageAsset, LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";
import type { RecipeCategory } from "./recipe-category.interface";
import type { RecipeFoodGroup } from "./recipe-food-group.interface";

export interface Recipe {
  _id: string;
  title: LocalizedString;
  description: LocalizedString;
  image: ImageAsset;
  /** Populated to the full category on read (via `relations`); a plain id string when writing. */
  category: RecipeCategory | string;
  foodGroups: (RecipeFoodGroup | string)[];
  ingredients: LocalizedString[];
  instructions: LocalizedString[];
  prepTime?: LocalizedString;
  cookTime?: LocalizedString;
  servings?: LocalizedString;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

/** The form's own value shape — `category`/`foodGroups` are always plain id strings (the FEATURE_COMBOBOX's own value shape), never populated objects. */
export interface RecipeFormValues {
  title: LocalizedString;
  description: LocalizedString;
  image: ImageAsset | File | null;
  category: string;
  foodGroups: string[];
  ingredients: LocalizedString[];
  instructions: LocalizedString[];
  prepTime: LocalizedString;
  cookTime: LocalizedString;
  servings: LocalizedString;
  status: ContentStatus;
}
