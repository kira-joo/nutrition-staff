import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { findBlocksCitingReference } from "src/server/books/references/find-blocks-citing-reference";
import { bookRepository } from "src/server/books/books.repository";

export async function removeBookReference(bookId: string, referenceId: string, expectedRevision: number) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const exists = book.references.some((reference) => reference.id === referenceId);
  if (!exists) throw new NotFoundError(`No reference exists with id "${referenceId}".`, { referenceId });

  const citingBlocks = findBlocksCitingReference(book, referenceId);
  if (citingBlocks.length > 0) {
    throw new BadRequestError(`This reference is cited by ${citingBlocks.length} block(s). Remove those citations first.`, {
      citingBlockIds: citingBlocks.map((block) => block.id),
    });
  }

  const nextReferences = book.references.filter((reference) => reference.id !== referenceId);

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
