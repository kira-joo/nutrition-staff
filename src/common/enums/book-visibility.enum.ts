/**
 * Independent of `BookStatus` and of the `allowFlipbook`/`allowPdfDownload`/
 * `showOnWebsite` flags. PUBLIC may appear in public Books surfaces;
 * UNLISTED is reachable only by direct URL.
 */
export enum BookVisibility {
  PUBLIC = "public",
  UNLISTED = "unlisted",
}
