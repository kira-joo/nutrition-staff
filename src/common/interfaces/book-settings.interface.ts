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

/**
 * Optional tiled logo watermark painted behind every ordinary paper page.
 *
 * `scaleMm` is a physical tile size, not a percentage, deliberately: the
 * same stylesheet drives Staff Preview, the client Flipbook and the PDF,
 * and only a physical unit renders identically across all three. A
 * percentage would resolve against three different box sizes.
 *
 * `image: null` is the off switch — pages then render exactly as they did
 * before this setting existed.
 */
export interface BookPageWatermark {
  image: ImageAsset | null;
  /** 0..1. Deliberately faint; see `DEFAULT_PAGE_WATERMARK`. */
  opacity: number;
  /** Width of one repeated tile, in millimetres. */
  scaleMm: number;
}

/** Reference-matching defaults, shared by the schema, the resolver and the staff form so the three cannot drift. */
export const DEFAULT_PAGE_WATERMARK: BookPageWatermark = { image: null, opacity: 0.05, scaleMm: 45 };

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
  pageWatermark: BookPageWatermark;
  templateVersion: string;
  createdAt: string;
  updatedAt: string;
}

export type BookSettingsFormValues = Omit<BookSettings, "_id" | "createdAt" | "updatedAt">;
