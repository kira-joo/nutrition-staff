import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { bookRepository } from "src/server/books/books.repository";

export async function reorderBookReferences(bookId: string, referenceIds: string[], expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const referencesById = new Map(book.references.map((reference) => [reference.id, reference]));

  if (referenceIds.length !== book.references.length || !referenceIds.every((id) => referencesById.has(id))) {
    throw new BadRequestError("referenceIds must be exactly this book's current reference ids, in the new order.");
  }

  const nextReferences = referenceIds.map((id) => referencesById.get(id)!);

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
