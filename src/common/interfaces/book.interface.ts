import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import type { BookOverrideKey, BookStatus, BookVisibility } from "../enums";
import type { BookContactBlock, BookPrintSettings, BookSocialLink } from "./book-settings.interface";
import type { Chapter, BookFrontMatter, BookBackMatter, BookReference } from "./book-chapter.interface";

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

/**
 * `"generated"` (default): the reusable template renders the dynamic
 * title/subtitle/doctor identity over the template's own artwork —
 * `coverImage`/`backCoverImage` are ignored entirely in this mode, even
 * if set. `"uploaded"`: the doctor's own finished A5 image (`coverImage`/
 * `backCoverImage`) becomes the ENTIRE page, full-bleed — nothing else is
 * rendered over it (no title, no frame, no doctor identity). Explicit
 * rather than inferred from image presence, so switching back to
 * "generated" needs no separate "clear the image" step: the uploaded
 * asset stays stored either way, and flipping back to "uploaded" later
 * restores it immediately without a re-upload. Front and back cover modes
 * are fully independent of each other.
 */
export type BookCoverMode = "generated" | "uploaded";

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  shortDescription?: string;
  category?: string;
  editionLabelTemplate?: string;
  coverMode: BookCoverMode;
  coverImage?: ImageAsset | null;
  backCoverMode: BookCoverMode;
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

  // Present on the detail GET (`/books/:id`) only — the list route
  // (`BOOK_LIST_PROJECTION`) deliberately excludes all four to keep the
  // books table cheap. A row fetched from the list endpoint will not have
  // these keys; the Content tab always re-fetches by id.
  frontMatter: BookFrontMatter;
  chapters: Chapter[];
  backMatter: BookBackMatter;
  references: BookReference[];

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
  | "coverMode"
  | "coverImage"
  | "backCoverMode"
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
