import { BadRequestError, ConflictError, NotFoundError } from "@kira-joo/backend-toolkit-core";
import { MAX_REFERENCES } from "src/common/books/book-limits";
import type { CreateBookReferenceDto } from "src/server/books/references/dto/book-reference.dto";
import { bookRepository } from "src/server/books/books.repository";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";

export async function addBookReference(bookId: string, dto: CreateBookReferenceDto) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });

  if (book.references.length >= MAX_REFERENCES) {
    throw new BadRequestError(`This book has reached its ${MAX_REFERENCES}-reference limit.`);
  }

  const newReference: BookReference = { id: crypto.randomUUID(), label: dto.label, text: dto.text, url: dto.url };
  const nextReferences = [...book.references, newReference];

  try {
    return await bookRepository.update(
      { where: { _id: bookId, contentRevision: dto.expectedRevision } },
      { references: nextReferences, contentRevision: dto.expectedRevision + 1 }
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
    }
    throw error;
  }
}
