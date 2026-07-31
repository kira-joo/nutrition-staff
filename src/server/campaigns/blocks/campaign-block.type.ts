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

// A plain heading + body text block. Named "richText" per the plan's block
// list, but grounded in what this app can actually author today — there's
// no WYSIWYG/HTML rich-text editor anywhere in this toolkit, so `body` is
// a plain multi-line LocalizedString (LOCALIZED_TEXTAREA), the same
// long-text pattern already used for Review.content/FaqItem.answer, not
// real HTML/markdown rendering. Revisit if genuine rich formatting becomes
// a real requirement.
export interface RichTextBlock {
  id: string;
  type: CampaignBlockType.RICH_TEXT;
  heading?: LocalizedString;
  body: LocalizedString;
  order: number;
}

/** Union of every block type — a new block type adds a member here. */
export type CampaignBlock = HeroBlock | RichTextBlock;
