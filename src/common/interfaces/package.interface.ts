import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus, IconKey, PackageVariant } from "../enums";

export interface PricingTier {
  originalPrice: number;
  price: number;
}

export interface PricingTiers {
  month: PricingTier;
  quarter: PricingTier;
  half: PricingTier;
}

export interface Seo {
  title: LocalizedString;
  description: LocalizedString;
}

export interface Package {
  _id: string;
  key: string;
  name: LocalizedString;
  tag?: LocalizedString;
  popular: boolean;
  variant: PackageVariant;
  icon: IconKey;
  followUpLabel: LocalizedString;
  pricingTiers: PricingTiers;
  details: LocalizedString[];
  order: number;
  status: ContentStatus;
  seoOverride?: Seo;
  createdAt: string;
  updatedAt: string;
}

export interface PackageFormValues {
  key: string;
  name: LocalizedString;
  tag: LocalizedString;
  popular: boolean;
  variant: PackageVariant;
  icon: IconKey;
  followUpLabel: LocalizedString;
  pricingTiers: PricingTiers;
  details: LocalizedString[];
  order?: number;
  status: ContentStatus;
  seoOverride: Seo;
}
