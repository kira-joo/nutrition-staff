import type { ImageAsset, LocalizedString, VideoAsset } from "@kira-joo/toolkit-common";
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

export interface FeatureGridItem {
  id: string;
  heading: LocalizedString;
  description?: LocalizedString;
}

// No icon field — there's no icon-picker concept anywhere in this toolkit
// for arbitrary, freely-authored items (IconKey is a closed 3-value set
// grounded in Package's real reference icons, not a general-purpose
// picker). Keeping this text-only avoids inventing new infrastructure for
// a requirement that only ever asked for validated nested localized
// content — revisit if a real visual requirement for icons emerges.
export interface FeatureGridBlock {
  id: string;
  type: CampaignBlockType.FEATURE_GRID;
  heading?: LocalizedString;
  items: FeatureGridItem[];
  order: number;
}

// "The approved image/video model" — mirrors Video's own at-least-one-of
// image/video shape (see HasMediaSource), reusing the same ImageAsset/
// VideoAsset types and upload-policy/asset-lifecycle conventions.
export interface MediaBlock {
  id: string;
  type: CampaignBlockType.MEDIA;
  image?: ImageAsset | null;
  video?: VideoAsset | null;
  caption?: LocalizedString;
  order: number;
}

export interface CtaBlock {
  id: string;
  type: CampaignBlockType.CTA;
  heading: LocalizedString;
  description?: LocalizedString;
  buttonLabel: LocalizedString;
  buttonUrl: string;
  order: number;
}

// References an existing FaqSection by id, rather than an array of
// individual FaqItem ids — simpler to validate (one reference, not N),
// simpler to render (all of that section's published items), and matches
// a real existing relation-picker (getFaqSectionsEndpoint) already built
// for the FaqItem module. Existence/availability is enforced separately
// (see assert-faq-ref-valid.ts), not by this shape alone.
export interface FaqRefBlock {
  id: string;
  type: CampaignBlockType.FAQ_REF;
  heading?: LocalizedString;
  faqSectionId: string;
  order: number;
}

export interface CountdownBlock {
  id: string;
  type: CampaignBlockType.COUNTDOWN;
  heading: LocalizedString;
  targetDate: string;
  expiredLabel?: LocalizedString;
  order: number;
}

/** Union of every block type — a new block type adds a member here. */
export type CampaignBlock = HeroBlock | RichTextBlock | FeatureGridBlock | MediaBlock | CtaBlock | FaqRefBlock | CountdownBlock;
