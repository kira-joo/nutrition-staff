import { ConflictError, NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { CHAPTER_ASSET_FIELDS, CHAPTER_ASSET_FOLDER } from "src/server/books/chapters/chapter-asset-fields";
import { UpdateChapterDto } from "src/server/books/chapters/dto/update-chapter.dto";
import { findChapterOrThrow } from "src/server/books/blocks/resolve-block-container";
import { bookRepository } from "src/server/books/books.repository";
import { assetProvider, destroyReplacedAssets, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";

export async function updateChapter(request: NextRequest, bookId: string, chapterId: string) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");

  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const previousChapter = findChapterOrThrow(book, chapterId);

  const { uploaded } = await processAssetUploadFields({ files, payload, fields: CHAPTER_ASSET_FIELDS, provider: assetProvider, folder: CHAPTER_ASSET_FOLDER });

  let saved;
  try {
    const dto = await validateDto(UpdateChapterDto, payload);
    const { expectedRevision, ...patchFields } = dto;

    const updatedChapter = { ...previousChapter, ...patchFields };
    const nextChapters = book.chapters.map((chapter) => (chapter.id === chapterId ? updatedChapter : chapter));
    assertBookSizeBudget({ ...book, chapters: nextChapters } as unknown as Record<string, unknown>);

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
  } catch (error) {
    await destroyUploadedAssets(assetProvider, uploaded);
    throw error;
  }

  await destroyReplacedAssets({
    provider: assetProvider,
    fields: CHAPTER_ASSET_FIELDS,
    files,
    payload,
    previousDocument: previousChapter as unknown as Record<string, unknown>,
  });
  return saved;
}
