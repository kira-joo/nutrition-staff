import type { ImageAsset, LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { CampaignBlockType } from "../enums";

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

/** Union of every block type — just `HeroBlock` this checkpoint; a new block type adds a member here (and to the block registry). */
export type CampaignBlock = HeroBlock;

/** The Hero block editor's own form-value shape — `image` can be a pending `File`, same as any other IMAGE_ASSET field. */
export interface HeroBlockFormValues {
  heading: LocalizedString;
  subheading: LocalizedString;
  image: ImageAsset | File | null;
  ctaLabel: LocalizedString;
  ctaUrl?: string;
}
