import { EntityName } from "./entity-name.enum";

/** Plural labels, for list-page contexts (e.g. FeatureTable's entityName). The singular label is just the enum value itself — no separate map needed. */
export const ENTITY_PLURAL_LABELS: Record<EntityName, string> = {
  [EntityName.USER]: "Users",
  [EntityName.ROLE]: "Roles",
  [EntityName.PERMISSION]: "Permissions",
  [EntityName.REVIEW]: "Reviews",
  [EntityName.SITE_SETTINGS]: "Site Settings",
  [EntityName.DOCTOR_PROFILE]: "Doctor Profile",
  [EntityName.PACKAGES_PAGE_SETTINGS]: "Packages Page Settings",
  [EntityName.CAMPAIGN]: "Campaigns",
  [EntityName.RECIPE_CATEGORY]: "Recipe Categories",
  [EntityName.RECIPE_FOOD_GROUP]: "Recipe Food Groups",
  [EntityName.RECIPE]: "Recipes",
  [EntityName.VIDEO]: "Videos",
  [EntityName.FAQ_SECTION]: "FAQ Sections",
  [EntityName.FAQ_ITEM]: "FAQ Items",
  [EntityName.PACKAGE]: "Packages",
  [EntityName.CLIENT]: "Clients",
  [EntityName.STAFF]: "Staff Profiles",
  [EntityName.CLIENT_MEASUREMENT]: "Measurements",
  [EntityName.NUTRITION_ASSESSMENT]: "Nutrition Assessments",
};
