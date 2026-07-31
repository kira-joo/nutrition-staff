import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";

export interface FaqSection {
  _id: string;
  title: LocalizedString;
  order: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FaqSectionFormValues {
  title: LocalizedString;
  order?: number;
  status: ContentStatus;
}
