import { CURRENT_BOOK_TEMPLATE_VERSION } from "src/common/books/book-template-version";
import { buildBookHtml } from "./build-book-html";

export interface BookTemplate {
  version: string;
  buildHtml: typeof buildBookHtml;
}

/**
 * Additive only — `dr-omnia-book-v1` is kept forever once a second
 * template version ever exists. A visual change ships as
 * `dr-omnia-book-v2`, a new entry here, never an edit to this one, so a
 * historical Edition's `templateVersion` always resolves to the exact
 * renderer it was published with.
 */
export const BOOK_TEMPLATE_REGISTRY: Record<string, BookTemplate> = {
  [CURRENT_BOOK_TEMPLATE_VERSION]: {
    version: CURRENT_BOOK_TEMPLATE_VERSION,
    buildHtml: buildBookHtml,
  },
};

export function getBookTemplate(version: string): BookTemplate {
  const template = BOOK_TEMPLATE_REGISTRY[version];
  if (!template) {
    throw new Error(`Unknown book template version: "${version}".`);
  }
  return template;
}
