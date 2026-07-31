import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";

export interface RecipeFoodGroup {
  _id: string;
  title: LocalizedString;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeFoodGroupFormValues {
  title: LocalizedString;
  status: ContentStatus;
}
