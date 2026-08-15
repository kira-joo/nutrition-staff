import { ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { assertBookBlockLimits } from "src/server/books/blocks/assert-book-block-limits";
import type { MoveBookBlockDto } from "src/server/books/blocks/dto/move-book-block.dto";
import { containerRefFromParams, getContainerBlocks, withContainerBlocks } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";
import type { BookSchema } from "src/server/books/book.schema";

/**
 * The one block mutation that touches two containers in the same request
 * — without this, dragging a block between chapters (or between a
 * chapter and front/back matter) has no endpoint at all, per the approved
 * architecture. Both containers are re-normalized (`order`) in the same
 * `bookRepository.update()` call, so a mid-move crash can never leave the
 * block duplicated in both places or missing from both.
 */
export async function moveBookBlock(bookId: string, dto: MoveBookBlockDto) {
  const fromRef = containerRefFromParams(dto.from);
  const toRef = containerRefFromParams(dto.to);

  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const fromBlocks = getContainerBlocks(book, fromRef);
  const blockIndex = fromBlocks.findIndex((block) => block.id === dto.blockId);
  if (blockIndex === -1) throw new NotFoundError(`No block exists with id "${dto.blockId}" in the source container.`, { blockId: dto.blockId });
  const movedBlock = fromBlocks[blockIndex];

  const sameContainer = JSON.stringify(fromRef) === JSON.stringify(toRef);
  const remainingFromBlocks = fromBlocks.filter((block) => block.id !== dto.blockId).map((block, order) => ({ ...block, order }));

  const destinationBlocks = sameContainer ? remainingFromBlocks : getContainerBlocks(book, toRef);
  const insertAt = Math.min(dto.toIndex ?? destinationBlocks.length, destinationBlocks.length);
  if (!sameContainer) assertBookBlockLimits(book, destinationBlocks.length + 1);
  const nextToBlocks = [...destinationBlocks.slice(0, insertAt), { ...movedBlock, order: insertAt }, ...destinationBlocks.slice(insertAt)].map(
    (block, order) => ({ ...block, order })
  );

  let patch: Partial<BookSchema>;
  if (sameContainer) {
    patch = withContainerBlocks(book, toRef, nextToBlocks);
  } else {
    const bookAfterRemoval = { ...book, ...withContainerBlocks(book, fromRef, remainingFromBlocks) } as BookSchema;
    const fromPatch = withContainerBlocks(book, fromRef, remainingFromBlocks);
    const toPatch = withContainerBlocks(bookAfterRemoval, toRef, nextToBlocks);
    patch = { ...fromPatch, ...toPatch };
  }

  assertBookSizeBudget({ ...book, ...patch } as unknown as Record<string, unknown>);

  try {
    return await bookRepository.update({ where: { _id: bookId, contentRevision: dto.expectedRevision } }, { ...patch, contentRevision: dto.expectedRevision + 1 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
