import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";
import type { CampaignBlock } from "./campaign-block.interface";

export interface Campaign {
  _id: string;
  title: LocalizedString;
  slug: string;
  startDate: string;
  endDate: string;
  status: ContentStatus;
  blocks: CampaignBlock[];
  createdAt: string;
  updatedAt: string;
}

/** The header form's own value shape — never includes `blocks`, which are managed by their own sub-resource routes/UI. */
export interface CampaignFormValues {
  title: LocalizedString;
  slug: string;
  startDate: string;
  endDate: string;
  status: ContentStatus;
}
