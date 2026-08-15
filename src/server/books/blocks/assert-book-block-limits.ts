import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import type { BookSchema } from "src/server/books/book.schema";
import { MAX_BLOCKS_PER_BOOK, MAX_BLOCKS_PER_CONTAINER } from "src/common/books/book-limits";

export function countAllBlocks(book: BookSchema): number {
  const chapterBlocks = book.chapters.reduce((sum, chapter) => sum + (chapter.blocks?.length ?? 0), 0);
  const frontMatterBlocks = Object.values(book.frontMatter ?? {}).reduce((sum, slot) => sum + (slot?.blocks?.length ?? 0), 0);
  const backMatterBlocks = Object.values(book.backMatter ?? {}).reduce((sum, slot) => sum + (slot?.blocks?.length ?? 0), 0);
  return chapterBlocks + frontMatterBlocks + backMatterBlocks;
}

/** Checked before a block is ADDED (never on replace/reorder, which don't change counts). */
export function assertBookBlockLimits(book: BookSchema, containerBlockCountAfterAdd: number): void {
  if (containerBlockCountAfterAdd > MAX_BLOCKS_PER_CONTAINER) {
    throw new BadRequestError(`This container has reached its ${MAX_BLOCKS_PER_CONTAINER}-block limit.`);
  }
  if (countAllBlocks(book) + 1 > MAX_BLOCKS_PER_BOOK) {
    throw new BadRequestError(`This book has reached its ${MAX_BLOCKS_PER_BOOK}-block limit.`);
  }
}
