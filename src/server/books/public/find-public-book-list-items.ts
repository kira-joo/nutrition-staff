import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import type { PaginatedResponse } from "@kira-joo/toolkit-common";
import { BookStatus, BookVisibility } from "src/common/enums";
import { PUBLIC_BOOK_LIST_PROJECTION, bookRepository } from "src/server/books/books.repository";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";
import type { PublicListBooksQueryDto } from "./dto/public-list-books-query.dto";

export interface PublicBookListItem {
  slug: string;
  /** Frozen — see `PUBLIC_BOOK_LIST_PROJECTION`'s comment for why these three specifically come from the Edition. */
  title: string;
  subtitle?: string;
  coverImage: ImageAsset | null;
  /** Live Book fields — catalog/discovery metadata, deliberately not frozen (same reasoning as the reader payload's `shortDescription`/`category`). */
  shortDescription?: string;
  category?: string;
  editionCount: number;
  lastPublishedAt?: string;
}

/** Only what a listing card needs from the Edition — never `content`/`resolvedSettings`/`recipeSnapshots`, which is exactly the "40-image content tab" mistake this query is designed to avoid, now at listing scale (N books per page, not one). */
const PUBLIC_BOOK_LIST_EDITION_PROJECTION = {
  titleAtPublish: true,
  subtitleAtPublish: true,
  coverImageAtPublish: true,
} as const;

/**
 * The public listing, Edition-backed: one query for the public Book
 * rows, one batched `$in` query for their current Editions' presentation
 * fields — never one Edition query per Book. A Book whose
 * `currentEditionId` doesn't resolve to a real Edition (should not
 * happen — `status: PUBLISHED` is only ever set in the same write that
 * sets `currentEditionId`, by `publish-book-edition.ts`) is dropped from
 * the page rather than shown with blank presentation fields.
 */
export async function findPublicBookListItems(query: PublicListBooksQueryDto): Promise<PaginatedResponse<PublicBookListItem>> {
  const result = await bookRepository.findAllAndCountPublic({
    query,
    where: { status: BookStatus.PUBLISHED, visibility: BookVisibility.PUBLIC, showOnWebsite: true },
    select: PUBLIC_BOOK_LIST_PROJECTION,
  });

  const editionIds = result.data.map((book) => book.currentEditionId).filter((id): id is NonNullable<typeof id> => Boolean(id)).map((id) => String(id));
  const editions = editionIds.length > 0 ? await bookEditionRepository.findByIds(editionIds, { select: PUBLIC_BOOK_LIST_EDITION_PROJECTION }) : [];
  const editionById = new Map(editions.map((edition) => [String(edition._id), edition]));

  const data: PublicBookListItem[] = [];
  for (const book of result.data) {
    const edition = book.currentEditionId ? editionById.get(String(book.currentEditionId)) : undefined;
    if (!edition) continue;
    data.push({
      slug: book.slug,
      title: edition.titleAtPublish,
      subtitle: edition.subtitleAtPublish,
      coverImage: edition.coverImageAtPublish ?? null,
      shortDescription: book.shortDescription,
      category: book.category,
      editionCount: book.editionCount,
      lastPublishedAt: book.lastPublishedAt?.toISOString(),
    });
  }

  return { ...result, data };
}
