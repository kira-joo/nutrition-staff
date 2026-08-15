import { ConflictError, NotFoundError, type AssetResourceType } from "@kira-joo/backend-toolkit-core";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { CHAPTER_ASSET_FIELDS } from "src/server/books/chapters/chapter-asset-fields";
import { getBookBlockAssetFields } from "src/server/books/blocks/book-block-asset-fields";
import { findChapterOrThrow } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";
import { assetProvider } from "src/server/core/assets";

/** Removes a chapter, re-normalizes `order` on the remaining chapters, then best-effort destroys the chapter's own cover image AND every asset any of its blocks owned — removing a chapter removes everything inside it. */
export async function removeChapter(bookId: string, chapterId: string, expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const removedChapter = findChapterOrThrow(book, chapterId);

  const nextChapters = book.chapters.filter((chapter) => chapter.id !== chapterId).map((chapter, order) => ({ ...chapter, order }));
  assertBookSizeBudget({ ...book, chapters: nextChapters } as unknown as Record<string, unknown>);

  let saved;
  try {
    saved = await bookRepository.update(
      { where: { _id: bookId, contentRevision: expectedRevision } },
      { chapters: nextChapters, contentRevision: expectedRevision + 1 }
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }

  const chapterCover = removedChapter.coverImage;
  if (chapterCover) {
    const field = CHAPTER_ASSET_FIELDS[0];
    try {
      await assetProvider.destroyAsset(chapterCover.publicId, field.kind as unknown as AssetResourceType);
    } catch (error) {
      console.error(`Failed to clean up removed chapter cover ${chapterCover.publicId}`, error);
    }
  }

  for (const block of removedChapter.blocks ?? []) {
    const assetFields = getBookBlockAssetFields(block.type);
    const blockRecord = block as unknown as Record<string, unknown>;
    for (const field of assetFields) {
      const asset = blockRecord[field.name] as { publicId: string } | undefined;
      if (!asset) continue;
      try {
        await assetProvider.destroyAsset(asset.publicId, field.kind as unknown as AssetResourceType);
      } catch (error) {
        console.error(`Failed to clean up removed chapter's block asset ${asset.publicId}`, error);
      }
    }
  }

  return saved;
}
