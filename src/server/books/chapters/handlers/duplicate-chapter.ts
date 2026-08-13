import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { MAX_CHAPTERS } from "src/common/books/book-limits";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { CHAPTER_ASSET_FOLDER } from "src/server/books/chapters/chapter-asset-fields";
import { cloneBookBlock } from "src/server/books/blocks/clone-book-block";
import { findChapterOrThrow } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";
import { duplicateImageAsset } from "src/server/core/assets";
import type { Chapter } from "src/common/interfaces/book-chapter.interface";

/**
 * Duplicates a chapter and every block inside it. Every IMAGE block (and
 * the chapter's own cover) gets a genuinely independent Cloudinary asset
 * — see `clone-book-block.ts`/`duplicate-image-asset.ts` — so removing
 * either copy never breaks the other. Bounded to one chapter's images
 * (not a whole-Book duplicate, which stays out of scope pending the S12
 * measurement).
 */
export async function duplicateChapter(bookId: string, chapterId: string, expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  if (book.chapters.length >= MAX_CHAPTERS) {
    throw new BadRequestError(`This book has reached its ${MAX_CHAPTERS}-chapter limit.`);
  }
  const sourceChapter = findChapterOrThrow(book, chapterId);
  const sourceIndex = book.chapters.findIndex((chapter) => chapter.id === chapterId);

  const clonedBlocks = await Promise.all(sourceChapter.blocks.map((block, index) => cloneBookBlock(block, index)));
  const clonedCover = sourceChapter.coverImage ? await duplicateImageAsset(sourceChapter.coverImage, CHAPTER_ASSET_FOLDER) : null;

  const newChapter: Chapter = {
    ...sourceChapter,
    id: crypto.randomUUID(),
    title: `${sourceChapter.title} (نسخة)`,
    coverImage: clonedCover,
    blocks: clonedBlocks,
    order: sourceIndex + 1,
  };

  const nextChapters = [
    ...book.chapters.slice(0, sourceIndex + 1),
    newChapter,
    ...book.chapters.slice(sourceIndex + 1),
  ].map((chapter, order) => ({ ...chapter, order }));

  assertBookSizeBudget({ ...book, chapters: nextChapters } as unknown as Record<string, unknown>);

  try {
    return await bookRepository.update(
      { where: { _id: bookId, contentRevision: expectedRevision } },
      { chapters: nextChapters, contentRevision: expectedRevision + 1 }
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
