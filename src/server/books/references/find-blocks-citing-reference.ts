import { BookBlockType } from "src/common/enums";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookSchema } from "src/server/books/book.schema";

function blockCitesReference(block: BookBlock, referenceId: string): boolean {
  if (block.type === BookBlockType.CITATION && block.referenceId === referenceId) return true;
  return (block.citationIds ?? []).includes(referenceId);
}

/** Every block anywhere in the book (chapters + front/back matter) that cites this reference — checked before a reference can be removed, so removal never leaves a dangling citation. */
export function findBlocksCitingReference(book: BookSchema, referenceId: string): BookBlock[] {
  const allBlocks: BookBlock[] = [
    ...book.chapters.flatMap((chapter) => chapter.blocks ?? []),
    ...Object.values(book.frontMatter ?? {}).flatMap((slot) => slot?.blocks ?? []),
    ...Object.values(book.backMatter ?? {}).flatMap((slot) => slot?.blocks ?? []),
  ];
  return allBlocks.filter((block) => blockCitesReference(block, referenceId));
}
