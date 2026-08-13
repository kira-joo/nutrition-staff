import { ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { assertBookBlockLimits } from "src/server/books/blocks/assert-book-block-limits";
import { cloneBookBlock } from "src/server/books/blocks/clone-book-block";
import { BlockContainerRef, getContainerBlocks, withContainerBlocks } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";

/** Duplicates a block in place (right after the original, same container) — the copy gets a fresh id and, if it owns an image, a genuinely independent asset (see `clone-book-block.ts`). */
export async function duplicateBookBlock(bookId: string, containerRef: BlockContainerRef, blockId: string, expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const containerBlocks = getContainerBlocks(book, containerRef);
  const blockIndex = containerBlocks.findIndex((block) => block.id === blockId);
  if (blockIndex === -1) throw new NotFoundError(`No block exists with id "${blockId}".`, { blockId });

  assertBookBlockLimits(book, containerBlocks.length + 1);

  const clone = await cloneBookBlock(containerBlocks[blockIndex], blockIndex + 1);
  const nextBlocks = [
    ...containerBlocks.slice(0, blockIndex + 1),
    clone,
    ...containerBlocks.slice(blockIndex + 1),
  ].map((block, order) => ({ ...block, order }));

  const patch = withContainerBlocks(book, containerRef, nextBlocks);
  assertBookSizeBudget({ ...book, ...patch } as unknown as Record<string, unknown>);

  try {
    return await bookRepository.update({ where: { _id: bookId, contentRevision: expectedRevision } }, { ...patch, contentRevision: expectedRevision + 1 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
