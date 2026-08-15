import { CacheTag } from "src/server/core/revalidation/cache-tag";

/**
 * One place each public-facing entity's cache tags are spelled out —
 * consumed directly as a route's `revalidateTags` option (a plain array
 * for a fixed tag set, or one of the functions below for a route whose
 * tags depend on `params`/`result`). No route calls `publishRevalidation`
 * itself anymore: `@kira-joo/backend-toolkit-next` (^0.4.0) resolves and
 * publishes `revalidateTags` declaratively, after the handler succeeds —
 * see toolkit.config.ts's `cache.publishRevalidation` registration.
 */
export const SITE_SETTINGS_TAGS = [CacheTag.SITE_SETTINGS];
export const DOCTOR_PROFILE_TAGS = [CacheTag.DOCTOR_PROFILE];
export const PACKAGES_PAGE_SETTINGS_TAGS = [CacheTag.PACKAGES_PAGE_SETTINGS];
export const PACKAGES_TAGS = [CacheTag.PACKAGES];
export const RECIPE_CATEGORIES_TAGS = [CacheTag.RECIPE_CATEGORIES];
export const RECIPE_FOOD_GROUPS_TAGS = [CacheTag.RECIPE_FOOD_GROUPS];
export const RECIPES_TAGS = [CacheTag.RECIPES];
export const REVIEWS_TAGS = [CacheTag.REVIEWS];
export const VIDEOS_TAGS = [CacheTag.VIDEOS];
/** Shared by both faq-sections and faq-items mutating routes — nutrition-client's composed GET /api/public/faq reads from both collections under this one tag. */
export const FAQ_TAGS = [CacheTag.FAQ];
export const CAMPAIGNS_TAGS = [CacheTag.CAMPAIGNS];
export const BOOKS_TAGS = [CacheTag.BOOKS];

/** A recipe update/delete busts both the list and that one recipe's detail page. */
export const recipeDetailTags = (id: string): string[] => [CacheTag.RECIPES, CacheTag.recipe(id)];

/** A campaign block mutation (add/replace/remove/reorder) busts the list and that campaign's detail page — block routes never change `slug`, so there's only ever one slug to invalidate. */
export const campaignDetailTags = (slug: string): string[] => [CacheTag.CAMPAIGNS, CacheTag.campaign(slug)];

/**
 * A campaign header update/delete busts the list and the *previous*
 * slug's detail page unconditionally (an old cached page must not linger
 * stale under a slug the campaign no longer uses), plus the new slug's
 * detail page only if it actually changed — `slug` is itself updatable,
 * so `previousSlug === newSlug` is the common case, not an edge case.
 */
export const campaignSlugChangeTags = (previousSlug: string, newSlug: string): string[] =>
  previousSlug === newSlug
    ? [CacheTag.CAMPAIGNS, CacheTag.campaign(newSlug)]
    : [CacheTag.CAMPAIGNS, CacheTag.campaign(previousSlug), CacheTag.campaign(newSlug)];

/** A book header update (`PUT /api/books/:id`) can change slug, visibility, showOnWebsite, allowFlipbook, allowPdfDownload, or status in one request — rather than special-casing which field actually flipped, this always busts the list plus both the old and new slug's detail cache, exactly like `campaignSlugChangeTags`. Over-invalidating a low-frequency staff action is cheap; under-invalidating is a real bug (a book that just went private/unlisted staying visible). */
export const bookSlugChangeTags = (previousSlug: string, newSlug: string): string[] =>
  previousSlug === newSlug ? [CacheTag.BOOKS, CacheTag.book(newSlug)] : [CacheTag.BOOKS, CacheTag.book(previousSlug), CacheTag.book(newSlug)];

/** Publishing a new Edition changes `currentEditionId`/`status`/`editionCount` — always busts the list and this book's detail page. */
export const bookDetailTags = (slug: string): string[] => [CacheTag.BOOKS, CacheTag.book(slug)];
