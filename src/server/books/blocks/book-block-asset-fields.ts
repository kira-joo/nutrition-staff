import { AssetKind, bookContentImagePolicy, type AssetFieldConfig } from "src/server/core/assets";
import { BookBlockType } from "src/common/enums";

/**
 * Per-block-type asset field config — mirrors
 * `BLOCK_ASSET_FIELDS_BY_TYPE` in `campaign-block-asset-fields.ts`. Only
 * `IMAGE` carries an asset; every other type maps to an empty array.
 * Field names here are flat (`"image"`, not a dotted path) because block
 * routes operate on ONE block per request — the multipart payload IS the
 * block, never the whole Book — so the dotted-path support added for
 * `BookOverrides` in Phase B isn't needed here at all.
 */
const BLOCK_ASSET_FIELDS_BY_TYPE: Record<BookBlockType, readonly AssetFieldConfig[]> = {
  [BookBlockType.HEADING]: [],
  [BookBlockType.SUBHEADING]: [],
  [BookBlockType.PARAGRAPH]: [],
  [BookBlockType.IMAGE]: [{ name: "image", kind: AssetKind.IMAGE, policy: bookContentImagePolicy }],
  [BookBlockType.BULLET_LIST]: [],
  [BookBlockType.NUMBERED_LIST]: [],
  [BookBlockType.CHECKLIST]: [],
  [BookBlockType.QUOTE]: [],
  [BookBlockType.TIP]: [],
  [BookBlockType.NOTE]: [],
  [BookBlockType.WARNING]: [],
  [BookBlockType.TABLE]: [],
  [BookBlockType.DIVIDER]: [],
  [BookBlockType.PAGE_BREAK]: [],
  [BookBlockType.QR_LINK]: [],
  [BookBlockType.RECIPE_REF]: [],
  [BookBlockType.CITATION]: [],
  [BookBlockType.PAGE_FOOTER_NOTE]: [],
};

export function getBookBlockAssetFields(type: BookBlockType): readonly AssetFieldConfig[] {
  return BLOCK_ASSET_FIELDS_BY_TYPE[type];
}

export const BOOK_BLOCK_ASSET_FOLDER = "nutrition/books/content";
