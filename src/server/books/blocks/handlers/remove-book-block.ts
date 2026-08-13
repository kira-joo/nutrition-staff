import { ConflictError, NotFoundError, type AssetResourceType } from "@kira-joo/backend-toolkit-core";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { getBookBlockAssetFields } from "src/server/books/blocks/book-block-asset-fields";
import { BlockContainerRef, getContainerBlocks, withContainerBlocks } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";
import { assetProvider } from "src/server/core/assets";

/**
 * Removes a block, re-normalizes `order` on the remaining blocks, then
 * best-effort destroys any asset the removed block owned — mirrors
 * `remove-campaign-block.ts` exactly, including the "log and move on"
 * failure handling for the asset cleanup (a failed cleanup must never
 * block the actual content removal the user asked for).
 */
export async function removeBookBlock(bookId: string, containerRef: BlockContainerRef, blockId: string, expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const containerBlocks = getContainerBlocks(book, containerRef);
  const removedBlock = containerBlocks.find((block) => block.id === blockId);
  if (!removedBlock) throw new NotFoundError(`No block exists with id "${blockId}".`, { blockId });

  const nextBlocks = containerBlocks.filter((block) => block.id !== blockId).map((block, order) => ({ ...block, order }));
  const patch = withContainerBlocks(book, containerRef, nextBlocks);
  assertBookSizeBudget({ ...book, ...patch } as unknown as Record<string, unknown>);

  let saved;
  try {
    saved = await bookRepository.update({ where: { _id: bookId, contentRevision: expectedRevision } }, { ...patch, contentRevision: expectedRevision + 1 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }

  const assetFields = getBookBlockAssetFields(removedBlock.type);
  const removedRecord = removedBlock as unknown as Record<string, unknown>;
  for (const field of assetFields) {
    const asset = removedRecord[field.name] as { publicId: string } | undefined;
    if (!asset) continue;
    try {
      await assetProvider.destroyAsset(asset.publicId, field.kind as unknown as AssetResourceType);
    } catch (error) {
      console.error(`Failed to clean up removed block asset ${asset.publicId}`, error);
    }
  }
  return saved;
}
