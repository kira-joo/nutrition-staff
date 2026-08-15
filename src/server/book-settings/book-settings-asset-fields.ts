import { AssetKind, bookLogoPolicy, bookPortraitPolicy, type AssetFieldConfig } from "src/server/core/assets";

export const BOOK_SETTINGS_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "doctorImage", kind: AssetKind.IMAGE, policy: bookPortraitPolicy },
  { name: "bookLogo", kind: AssetKind.IMAGE, policy: bookLogoPolicy },
];

export const BOOK_SETTINGS_ASSET_FOLDER = "nutrition/books/settings";
