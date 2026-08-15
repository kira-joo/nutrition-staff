import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { BlockContainerRef, getContainerBlocks, withContainerBlocks } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";

/** Reorders a container's blocks to match `blockIds` exactly — a pure position change, no asset or content operations. Requires the complete current id set (rejects partial lists), same contract as `reorderCampaignBlocks`. */
export async function reorderBookBlocks(bookId: string, containerRef: BlockContainerRef, blockIds: string[], expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const containerBlocks = getContainerBlocks(book, containerRef);
  const blocksById = new Map(containerBlocks.map((block) => [block.id, block]));

  if (blockIds.length !== containerBlocks.length || !blockIds.every((id) => blocksById.has(id))) {
    throw new BadRequestError("blockIds must be exactly this container's current block ids, in the new order.");
  }

  const nextBlocks = blockIds.map((id, order) => ({ ...blocksById.get(id)!, order }));
  const patch = withContainerBlocks(book, containerRef, nextBlocks);

  try {
    return await bookRepository.update({ where: { _id: bookId, contentRevision: expectedRevision } }, { ...patch, contentRevision: expectedRevision + 1 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
