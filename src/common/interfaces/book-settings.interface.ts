import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import type { BookMarginPreset, BookPageSize } from "../enums";

export interface BookSocialLink {
  platform: string;
  url: string;
  order: number;
}

export interface BookContactBlock {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
}

export interface BookPrintSettings {
  pageSize: BookPageSize;
  marginPreset: BookMarginPreset;
  gutterMm: number;
  pageNumberStart: number;
  doublePageSpread: boolean;
}

/** The Books-level publishing profile — deliberately separate from DoctorProfile/SiteSettings, never auto-synced. */
export interface BookSettings {
  _id: string;
  doctorName: string;
  doctorTitle: string;
  doctorBio: string;
  doctorImage?: ImageAsset | null;
  bookLogo?: ImageAsset | null;
  websiteUrl?: string;
  socialLinks: BookSocialLink[];
  contact: BookContactBlock;
  disclaimer: string;
  copyrightText: string;
  backCoverClosingText: string;
  backCoverAudienceText: string;
  defaultQrDestination?: string;
  print: BookPrintSettings;
  templateVersion: string;
  createdAt: string;
  updatedAt: string;
}

export type BookSettingsFormValues = Omit<BookSettings, "_id" | "createdAt" | "updatedAt">;
