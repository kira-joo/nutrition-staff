import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { publishRevalidation } from "src/server/core/revalidation/publish-revalidation";

/**
 * One thin function per public-facing entity, each calling
 * `publishRevalidation` with exactly the tags that entity's mutating
 * routes (`src/app/api/<entity>/**`) need to bust — the single place each
 * entity's tag set is spelled out, instead of every route repeating it.
 *
 * `revalidateRecipes`/`revalidateCampaigns` take an optional entity id/slug
 * to also bust that one detail page's tag, mirroring nutrition-client's
 * multi-tag convention (`[CacheTag.RECIPES, CacheTag.recipe(id)]`) — omit
 * it for a create (no detail page exists yet) or a list-only change.
 */
export const revalidateSiteSettings = () => publishRevalidation([CacheTag.SITE_SETTINGS]);

export const revalidateDoctorProfile = () => publishRevalidation([CacheTag.DOCTOR_PROFILE]);

export const revalidatePackagesPageSettings = () => publishRevalidation([CacheTag.PACKAGES_PAGE_SETTINGS]);

export const revalidatePackages = () => publishRevalidation([CacheTag.PACKAGES]);

export const revalidateRecipeCategories = () => publishRevalidation([CacheTag.RECIPE_CATEGORIES]);

export const revalidateRecipeFoodGroups = () => publishRevalidation([CacheTag.RECIPE_FOOD_GROUPS]);

export const revalidateRecipes = (id?: string) =>
  publishRevalidation(id ? [CacheTag.RECIPES, CacheTag.recipe(id)] : [CacheTag.RECIPES]);

export const revalidateReviews = () => publishRevalidation([CacheTag.REVIEWS]);

export const revalidateVideos = () => publishRevalidation([CacheTag.VIDEOS]);

/** Shared by both faq-sections and faq-items mutating routes — nutrition-client's composed GET /api/public/faq reads from both collections under this one tag. */
export const revalidateFaq = () => publishRevalidation([CacheTag.FAQ]);

export const revalidateCampaigns = (slug?: string) =>
  publishRevalidation(slug ? [CacheTag.CAMPAIGNS, CacheTag.campaign(slug)] : [CacheTag.CAMPAIGNS]);
