import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import type { BookOverrideKey, BookStatus, BookVisibility } from "../enums";
import type { BookContactBlock, BookPrintSettings, BookSocialLink } from "./book-settings.interface";

/** Mirrors the overridable subset of BookSettings. Every field is optional — only keys present in `Book.overriddenFields` are actually resolved from here. */
export interface BookOverrides {
  doctorName?: string;
  doctorTitle?: string;
  doctorBio?: string;
  doctorImage?: ImageAsset | null;
  bookLogo?: ImageAsset | null;
  websiteUrl?: string;
  socialLinks?: BookSocialLink[];
  contact?: BookContactBlock;
  disclaimer?: string;
  copyrightText?: string;
  backCoverClosingText?: string;
  backCoverAudienceText?: string;
  qrDestination?: string;
  print?: Partial<BookPrintSettings>;
}

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  shortDescription?: string;
  category?: string;
  editionLabelTemplate?: string;
  coverImage?: ImageAsset | null;
  backCoverImage?: ImageAsset | null;

  status: BookStatus;
  visibility: BookVisibility;
  allowFlipbook: boolean;
  allowPdfDownload: boolean;
  showOnWebsite: boolean;

  revision: number;
  contentRevision: number;
  currentEditionId?: string;
  lastPublishedAt?: string;
  editionCount: number;

  overrides: BookOverrides;
  overriddenFields: BookOverrideKey[];

  createdAt: string;
  updatedAt: string;
}

/** Header-only fields the Book overview form actually edits in Phase B — chapters/frontMatter/backMatter/references are edited elsewhere, never through this route. */
export type BookFormValues = Pick<
  Book,
  | "title"
  | "subtitle"
  | "slug"
  | "shortDescription"
  | "category"
  | "editionLabelTemplate"
  | "coverImage"
  | "backCoverImage"
  | "visibility"
  | "allowFlipbook"
  | "allowPdfDownload"
  | "showOnWebsite"
>;

export interface CreateBookFormValues {
  title: string;
  subtitle?: string;
  slug: string;
  category?: string;
}
