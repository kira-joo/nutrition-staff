import { ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import type { UpdateBookReferenceDto } from "src/server/books/references/dto/book-reference.dto";
import { bookRepository } from "src/server/books/books.repository";

export async function updateBookReference(bookId: string, referenceId: string, dto: UpdateBookReferenceDto) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });

  const index = book.references.findIndex((reference) => reference.id === referenceId);
  if (index === -1) throw new NotFoundError(`No reference exists with id "${referenceId}".`, { referenceId });

  const { expectedRevision, ...patchFields } = dto;
  const nextReferences = book.references.map((reference, i) => (i === index ? { ...reference, ...patchFields } : reference));

  try {
    return await bookRepository.update(
      { where: { _id: bookId, contentRevision: expectedRevision } },
      { references: nextReferences, contentRevision: expectedRevision + 1 }
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
