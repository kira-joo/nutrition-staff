import { BadRequestError, ConflictError, NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { MAX_CHAPTERS } from "src/common/books/book-limits";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { CHAPTER_ASSET_FOLDER, CHAPTER_ASSET_FIELDS } from "src/server/books/chapters/chapter-asset-fields";
import { CreateChapterDto } from "src/server/books/chapters/dto/create-chapter.dto";
import { bookRepository } from "src/server/books/books.repository";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import type { Chapter } from "src/common/interfaces/book-chapter.interface";

export async function addChapter(request: NextRequest, bookId: string) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");

  const book = await bookRepository.findOne({ where: { _id: bookId } });
  if (book.chapters.length >= MAX_CHAPTERS) {
    throw new BadRequestError(`This book has reached its ${MAX_CHAPTERS}-chapter limit.`);
  }

  const { uploaded } = await processAssetUploadFields({ files, payload, fields: CHAPTER_ASSET_FIELDS, provider: assetProvider, folder: CHAPTER_ASSET_FOLDER });

  try {
    const dto = await validateDto(CreateChapterDto, payload);
    const { expectedRevision, ...chapterFields } = dto;

    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: chapterFields.title,
      subtitle: chapterFields.subtitle,
      intro: chapterFields.intro,
      coverImage: chapterFields.coverImage ?? null,
      startOnNewPage: chapterFields.startOnNewPage ?? true,
      includeInToc: chapterFields.includeInToc ?? true,
      tocTitle: chapterFields.tocTitle,
      blocks: [],
      order: book.chapters.length,
    };
    const nextChapters = [...book.chapters, newChapter];
    assertBookSizeBudget({ ...book, chapters: nextChapters } as unknown as Record<string, unknown>);

    try {
      return await bookRepository.update({ where: { _id: bookId, contentRevision: expectedRevision } }, { chapters: nextChapters, contentRevision: expectedRevision + 1 });
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
}
