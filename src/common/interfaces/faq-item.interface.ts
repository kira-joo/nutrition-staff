import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";
import type { FaqSection } from "./faq-section.interface";

export interface FaqItem {
  _id: string;
  section: FaqSection | string;
  question: LocalizedString;
  answer: LocalizedString;
  order: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FaqItemFormValues {
  section: string;
  question: LocalizedString;
  answer: LocalizedString;
  order?: number;
  status: ContentStatus;
}
