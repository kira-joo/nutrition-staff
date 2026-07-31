import type { ImageAsset, LocalizedString, VideoAsset } from "@kira-joo/frontend-toolkit-core";
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

export interface FeatureGridBlock {
  id: string;
  type: CampaignBlockType.FEATURE_GRID;
  heading?: LocalizedString;
  items: FeatureGridItem[];
  order: number;
}

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

/** Union of every block type — a new block type adds a member here (and to the block registry). */
export type CampaignBlock = HeroBlock | RichTextBlock | FeatureGridBlock | MediaBlock | CtaBlock | FaqRefBlock | CountdownBlock;

/** The Hero block editor's own form-value shape — `image` can be a pending `File`, same as any other IMAGE_ASSET field. */
export interface HeroBlockFormValues {
  heading: LocalizedString;
  subheading: LocalizedString;
  image: ImageAsset | File | null;
  ctaLabel: LocalizedString;
  ctaUrl?: string;
}

export interface RichTextBlockFormValues {
  heading: LocalizedString;
  body: LocalizedString;
}

export interface FeatureGridBlockFormValues {
  heading: LocalizedString;
  items: FeatureGridItem[];
}

export interface MediaBlockFormValues {
  image: ImageAsset | File | null;
  video: VideoAsset | File | null;
  caption: LocalizedString;
}

export interface CtaBlockFormValues {
  heading: LocalizedString;
  description: LocalizedString;
  buttonLabel: LocalizedString;
  buttonUrl?: string;
}

export interface FaqRefBlockFormValues {
  heading: LocalizedString;
  faqSectionId: string;
}

export interface CountdownBlockFormValues {
  heading: LocalizedString;
  targetDate: string;
  expiredLabel: LocalizedString;
}
