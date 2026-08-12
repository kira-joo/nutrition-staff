import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { BOOK_SIZE_SOFT_BUDGET_BYTES } from "src/common/books/book-limits";

/**
 * Checked before every content-mutating save. `chapters`/`frontMatter`/
 * `backMatter`/`references` are `Mixed` — Mongoose validates nothing on
 * that path — so this soft budget (well under the 16MB BSON hard limit) is
 * one of the few real defences against a pathological document. Not yet
 * exercised by any Phase B route (nothing here writes chapters/blocks
 * yet), but wired in now so Phase C's block/chapter routes have it for
 * free rather than needing to remember to add it later.
 */
export function assertBookSizeBudget(book: Record<string, unknown>): void {
  const sizeBytes = Buffer.byteLength(JSON.stringify(book));
  if (sizeBytes > BOOK_SIZE_SOFT_BUDGET_BYTES) {
    const sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
    const limitMb = (BOOK_SIZE_SOFT_BUDGET_BYTES / 1024 / 1024).toFixed(0);
    throw new BadRequestError(`This book's content is too large (${sizeMb}MB, limit ${limitMb}MB). Split it into shorter chapters or remove unused content.`);
  }
}
