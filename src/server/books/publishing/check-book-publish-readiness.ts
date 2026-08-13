import { resolveBookIdentity } from "src/common/books/resolve-book-identity";
import { bookSettingsRepository } from "src/server/book-settings/book-settings.repository";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { bookRepository } from "src/server/books/books.repository";
import { validateBookForPublish } from "./validate-book-for-publish";

/** The dry-run counterpart to `publishBookEdition` — same validation, no snapshotting or writes, so the staff UI can show the checklist (and let the doctor acknowledge warnings) before committing to Publish. */
export async function checkBookPublishReadiness(bookId: string) {
  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const settings = await getOrCreateSingleton(bookSettingsRepository, {});
  const identity = resolveBookIdentity(settings as unknown as Parameters<typeof resolveBookIdentity>[0], book);
  return validateBookForPublish(book, identity);
}
