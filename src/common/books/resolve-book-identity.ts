import { BookOverrideKey } from "../enums";
import type { BookOverrides } from "../interfaces/book.interface";
import type { BookContactBlock, BookPageWatermark, BookPrintSettings, BookSettings, BookSocialLink } from "../interfaces/book-settings.interface";
import { DEFAULT_PAGE_WATERMARK } from "../interfaces/book-settings.interface";
import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";

export interface ResolvedBookIdentity {
  doctorName: string;
  doctorTitle: string;
  doctorBio: string;
  doctorImage: ImageAsset | null;
  bookLogo: ImageAsset | null;
  websiteUrl: string | null;
  socialLinks: BookSocialLink[];
  contact: BookContactBlock;
  disclaimer: string;
  copyrightText: string;
  backCoverClosingText: string;
  backCoverAudienceText: string;
  qrDestination: string | null;
  print: BookPrintSettings;
  pageWatermark: BookPageWatermark;
  templateVersion: string;
  /** Per key: where the resolved value came from — drives both the staff UI badges and publish validation. */
  sources: Record<BookOverrideKey, "override" | "default" | "unset">;
}

type BookForResolution = { overrides: BookOverrides; overriddenFields: BookOverrideKey[] };

function isOverridden(book: BookForResolution, key: BookOverrideKey): boolean {
  return book.overriddenFields.includes(key);
}

function sourceFor(book: BookForResolution, key: BookOverrideKey, defaultValue: unknown): "override" | "default" | "unset" {
  if (isOverridden(book, key)) return "override";
  return defaultValue === undefined || defaultValue === null || defaultValue === "" ? "unset" : "default";
}

/**
 * The single shared inheritance resolver: `Book override → BookSettings
 * default`. Three consumers use this — staff preview (resolved live),
 * publish (resolved once and frozen into the Edition), and the staff
 * overrides UI (to render "Using books default" vs "Override for this
 * book"). The renderer itself never calls this: it receives the already-
 * resolved result as a plain input, so a historical Edition's frozen
 * values can never be recomputed against today's BookSettings.
 */
export function resolveBookIdentity(settings: BookSettings, book: BookForResolution): ResolvedBookIdentity {
  const overrides = book.overrides ?? {};

  return {
    doctorName: isOverridden(book, BookOverrideKey.DOCTOR_NAME) ? (overrides.doctorName ?? "") : settings.doctorName,
    doctorTitle: isOverridden(book, BookOverrideKey.DOCTOR_TITLE) ? (overrides.doctorTitle ?? "") : settings.doctorTitle,
    doctorBio: isOverridden(book, BookOverrideKey.DOCTOR_BIO) ? (overrides.doctorBio ?? "") : settings.doctorBio,
    doctorImage: isOverridden(book, BookOverrideKey.DOCTOR_IMAGE) ? (overrides.doctorImage ?? null) : (settings.doctorImage ?? null),
    bookLogo: isOverridden(book, BookOverrideKey.BOOK_LOGO) ? (overrides.bookLogo ?? null) : (settings.bookLogo ?? null),
    websiteUrl: isOverridden(book, BookOverrideKey.WEBSITE_URL) ? (overrides.websiteUrl ?? null) : (settings.websiteUrl ?? null),
    socialLinks: isOverridden(book, BookOverrideKey.SOCIAL_LINKS) ? (overrides.socialLinks ?? []) : settings.socialLinks,
    contact: isOverridden(book, BookOverrideKey.CONTACT) ? (overrides.contact ?? {}) : settings.contact,
    disclaimer: isOverridden(book, BookOverrideKey.DISCLAIMER) ? (overrides.disclaimer ?? "") : settings.disclaimer,
    copyrightText: isOverridden(book, BookOverrideKey.COPYRIGHT_TEXT) ? (overrides.copyrightText ?? "") : settings.copyrightText,
    backCoverClosingText: isOverridden(book, BookOverrideKey.BACK_COVER_CLOSING_TEXT)
      ? (overrides.backCoverClosingText ?? "")
      : settings.backCoverClosingText,
    backCoverAudienceText: isOverridden(book, BookOverrideKey.BACK_COVER_AUDIENCE_TEXT)
      ? (overrides.backCoverAudienceText ?? "")
      : settings.backCoverAudienceText,
    qrDestination: isOverridden(book, BookOverrideKey.QR_DESTINATION)
      ? (overrides.qrDestination ?? null)
      : (settings.defaultQrDestination ?? null),
    print: isOverridden(book, BookOverrideKey.PRINT) ? { ...settings.print, ...overrides.print } : settings.print,
    // Same partial-merge shape as `print`, and layered over
    // DEFAULT_PAGE_WATERMARK so a settings document written before this
    // field existed still resolves to a complete, renderable object
    // rather than `undefined` reaching the template.
    pageWatermark: {
      ...DEFAULT_PAGE_WATERMARK,
      ...(settings.pageWatermark ?? {}),
      ...(isOverridden(book, BookOverrideKey.PAGE_WATERMARK) ? (overrides.pageWatermark ?? {}) : {}),
    },
    templateVersion: settings.templateVersion,
    sources: {
      [BookOverrideKey.PAGE_WATERMARK]: sourceFor(book, BookOverrideKey.PAGE_WATERMARK, settings.pageWatermark?.image),
      [BookOverrideKey.DOCTOR_NAME]: sourceFor(book, BookOverrideKey.DOCTOR_NAME, settings.doctorName),
      [BookOverrideKey.DOCTOR_TITLE]: sourceFor(book, BookOverrideKey.DOCTOR_TITLE, settings.doctorTitle),
      [BookOverrideKey.DOCTOR_BIO]: sourceFor(book, BookOverrideKey.DOCTOR_BIO, settings.doctorBio),
      [BookOverrideKey.DOCTOR_IMAGE]: sourceFor(book, BookOverrideKey.DOCTOR_IMAGE, settings.doctorImage),
      [BookOverrideKey.BOOK_LOGO]: sourceFor(book, BookOverrideKey.BOOK_LOGO, settings.bookLogo),
      [BookOverrideKey.WEBSITE_URL]: sourceFor(book, BookOverrideKey.WEBSITE_URL, settings.websiteUrl),
      [BookOverrideKey.SOCIAL_LINKS]: sourceFor(book, BookOverrideKey.SOCIAL_LINKS, settings.socialLinks?.length ? settings.socialLinks : undefined),
      [BookOverrideKey.CONTACT]: sourceFor(book, BookOverrideKey.CONTACT, settings.contact),
      [BookOverrideKey.DISCLAIMER]: sourceFor(book, BookOverrideKey.DISCLAIMER, settings.disclaimer),
      [BookOverrideKey.COPYRIGHT_TEXT]: sourceFor(book, BookOverrideKey.COPYRIGHT_TEXT, settings.copyrightText),
      [BookOverrideKey.BACK_COVER_CLOSING_TEXT]: sourceFor(book, BookOverrideKey.BACK_COVER_CLOSING_TEXT, settings.backCoverClosingText),
      [BookOverrideKey.BACK_COVER_AUDIENCE_TEXT]: sourceFor(book, BookOverrideKey.BACK_COVER_AUDIENCE_TEXT, settings.backCoverAudienceText),
      [BookOverrideKey.QR_DESTINATION]: sourceFor(book, BookOverrideKey.QR_DESTINATION, settings.defaultQrDestination),
      [BookOverrideKey.PRINT]: sourceFor(book, BookOverrideKey.PRINT, settings.print),
    },
  };
}
