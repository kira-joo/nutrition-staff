import { AssetKind, bookContentImagePolicy, type AssetFieldConfig } from "src/server/core/assets";

export const CHAPTER_ASSET_FIELDS: readonly AssetFieldConfig[] = [{ name: "coverImage", kind: AssetKind.IMAGE, policy: bookContentImagePolicy }];

export const CHAPTER_ASSET_FOLDER = "nutrition/books/content";
