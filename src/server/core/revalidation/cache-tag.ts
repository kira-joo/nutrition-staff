/**
 * Mirrors nutrition-client's `src/lib/cache/cache-tags.ts` string values
 * exactly — two intentionally separate project-level definitions (not a
 * shared toolkit package; see nutrition-client's docs/architecture.md for
 * why), kept in sync by hand. This is the vocabulary `publishRevalidation`
 * calls use to tell nutrition-client which Next.js Data Cache tags to
 * invalidate after a successful write here.
 */
export const CacheTag = {
  SITE_SETTINGS: "site-settings",
  DOCTOR_PROFILE: "doctor-profile",
  PACKAGES_PAGE_SETTINGS: "packages-page-settings",
  PACKAGES: "packages",
  RECIPE_CATEGORIES: "recipe-categories",
  RECIPE_FOOD_GROUPS: "recipe-food-groups",
  RECIPES: "recipes",
  recipe: (id: string) => `recipe:${id}`,
  REVIEWS: "reviews",
  VIDEOS: "videos",
  FAQ: "faq",
  CAMPAIGNS: "campaigns",
  campaign: (slug: string) => `campaign:${slug}`,
  BOOKS: "books",
  book: (slug: string) => `book:${slug}`,
} as const;
