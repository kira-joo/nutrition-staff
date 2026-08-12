import { AssetKind, bookLogoPolicy, bookPortraitPolicy, type AssetFieldConfig } from "src/server/core/assets";

/**
 * Covers header assets AND the dotted override paths
 * (`overrides.doctorImage`/`overrides.bookLogo`) — `processAssetUploadFields`/
 * `destroyReplacedAssets` both support a dotted `name` now (see
 * process-asset-upload-fields.ts), so this is one flat table rather than a
 * split top-level/override structure.
 */
export const BOOK_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "coverImage", kind: AssetKind.IMAGE, policy: bookPortraitPolicy },
  { name: "backCoverImage", kind: AssetKind.IMAGE, policy: bookPortraitPolicy },
  // Same print-grade policy as BookSettings.doctorImage: a per-book
  // override still ends up on a printed page, so it gets no lower a bar
  // than the default it's overriding.
  { name: "overrides.doctorImage", kind: AssetKind.IMAGE, policy: bookPortraitPolicy },
  { name: "overrides.bookLogo", kind: AssetKind.IMAGE, policy: bookLogoPolicy },
];

export const BOOK_ASSET_FOLDER = "nutrition/books/covers";
