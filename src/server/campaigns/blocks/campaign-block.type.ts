import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import type { CampaignBlockType } from "src/common/enums";

export interface HeroBlock {
  id: string;
  type: CampaignBlockType.HERO;
  heading: LocalizedString;
  subheading?: LocalizedString;
  image?: ImageAsset | null;
  ctaLabel?: LocalizedString;
  ctaUrl?: string;
  order: number;
}

/** Union of every block type — just `HeroBlock` this checkpoint; a new block type adds a member here. */
export type CampaignBlock = HeroBlock;
