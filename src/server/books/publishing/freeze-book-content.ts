import type { FrozenBookContent } from "src/server/books/editions/book-edition.schema";
import type { BookSchema } from "src/server/books/book.schema";

/**
 * A real deep copy, not a reference — the whole point of an Edition is
 * that later Book/Chapter/Block mutations can never reach it. JSON
 * round-trip is safe here: every field inside frontMatter/chapters/
 * backMatter/references is already plain JSON-shaped data (strings,
 * numbers, booleans, ImageAsset objects, ProseMirror JSON) with no
 * Date/ObjectId/class instances nested inside.
 */
export function freezeBookContent(book: Pick<BookSchema, "frontMatter" | "chapters" | "backMatter" | "references">): FrozenBookContent {
  return JSON.parse(
    JSON.stringify({
      frontMatter: book.frontMatter,
      chapters: book.chapters,
      backMatter: book.backMatter,
      references: book.references,
    })
  );
}
