import { BookBlockType } from "src/common/enums";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import { BOOK_BLOCK_ASSET_FOLDER } from "src/server/books/blocks/book-block-asset-fields";
import { duplicateImageAsset } from "src/server/core/assets";

/**
 * Clones a single block with a fresh id (and, for CHECKLIST, fresh item
 * ids) and `order`. IMAGE blocks get a genuinely independent Cloudinary
 * asset (see `duplicate-image-asset.ts`) — the whole point of this
 * function existing separately from a plain object spread.
 */
export async function cloneBookBlock(block: BookBlock, order: number): Promise<BookBlock> {
  const cloned: BookBlock = { ...block, id: crypto.randomUUID(), order };

  if (cloned.type === BookBlockType.IMAGE && cloned.image) {
    cloned.image = await duplicateImageAsset(cloned.image, BOOK_BLOCK_ASSET_FOLDER);
  }
  if (cloned.type === BookBlockType.CHECKLIST) {
    cloned.items = cloned.items.map((item) => ({ ...item, id: crypto.randomUUID() }));
  }

  return cloned;
}
