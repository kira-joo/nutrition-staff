import { AssetKind, bookLogoPolicy, bookPortraitPolicy, type AssetFieldConfig } from "src/server/core/assets";

export const BOOK_SETTINGS_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "doctorImage", kind: AssetKind.IMAGE, policy: bookPortraitPolicy },
  { name: "bookLogo", kind: AssetKind.IMAGE, policy: bookLogoPolicy },
  // Dotted path, handled by `process-asset-upload-fields`'s getAtPath/
  // setAtPath — the same mechanism Books' `overrides.*` assets already use.
  // Reuses `bookLogoPolicy`: a watermark is the same kind of small
  // transparent brand mark, so it inherits the same size/format guard and
  // the same replaced-asset destruction path.
  { name: "pageWatermark.image", kind: AssetKind.IMAGE, policy: bookLogoPolicy },
];

export const BOOK_SETTINGS_ASSET_FOLDER = "nutrition/books/settings";
