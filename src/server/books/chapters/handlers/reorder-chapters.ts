import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { bookRepository } from "src/server/books/books.repository";

export async function reorderChapters(bookId: string, chapterIds: string[], expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const chaptersById = new Map(book.chapters.map((chapter) => [chapter.id, chapter]));

  if (chapterIds.length !== book.chapters.length || !chapterIds.every((id) => chaptersById.has(id))) {
    throw new BadRequestError("chapterIds must be exactly this book's current chapter ids, in the new order.");
  }

  const nextChapters = chapterIds.map((id, order) => ({ ...chaptersById.get(id)!, order }));

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
