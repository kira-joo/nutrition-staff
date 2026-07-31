import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";

export interface RecipeCategory {
  _id: string;
  title: LocalizedString;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeCategoryFormValues {
  title: LocalizedString;
  status: ContentStatus;
}
