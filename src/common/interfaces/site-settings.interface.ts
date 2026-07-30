import type { ImageAsset, LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { Currency } from "../enums";

export interface SocialLink {
  platform: string;
  url: string;
  order: number;
}

export interface Seo {
  title: LocalizedString;
  description: LocalizedString;
}

export interface SiteSettings {
  _id: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  currencyCode: Currency;
  socialLinks: SocialLink[];
  logo?: ImageAsset | null;
  favicon?: ImageAsset | null;
  defaultSeo: Seo;
  ogImage?: ImageAsset | null;
  activeCampaignId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The form's own value shape: the existing `ImageAsset` while unedited, a
 * freshly-picked `File` pending upload, or `null` once explicitly cleared
 * — see `CustomImageAssetUpload`'s docs.
 */
export interface SiteSettingsFormValues {
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  currencyCode: Currency;
  socialLinks: SocialLink[];
  logo: ImageAsset | File | null;
  favicon: ImageAsset | File | null;
  defaultSeo: Seo;
  ogImage: ImageAsset | File | null;
  activeCampaignId?: string;
}
