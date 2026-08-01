import {
  ChefHat,
  FlaskConical,
  Globe,
  HelpCircle,
  Home,
  Images,
  ListTree,
  Megaphone,
  MessageSquareQuote,
  Package as PackageIcon,
  Salad,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCog,
  Users,
  Video as VideoIcon,
} from "lucide-react";
import type { SideNavItemConfig, SideNavSectionConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { AppPermission } from "src/common/authorization/app-permission";
import { AppRoute } from "src/common/routes/app-route";

export const sideNavSections: SideNavSectionConfig[] = [
  {
    key: "general",
    items: [{ key: "home", label: "Home", href: AppRoute.home, icon: Home }],
  },
  {
    key: "clients",
    label: "Clients",
    items: [
      {
        key: "clients",
        label: "Clients & Leads",
        href: AppRoute.clients,
        icon: UserRoundCog,
        permission: AppPermission.CLIENT.READ,
      },
      {
        key: "calculators",
        label: "Calculators",
        href: AppRoute.calculators,
        icon: FlaskConical,
        permission: AppPermission.NUTRITION_CALCULATION.CREATE,
      },
    ],
  },
  {
    key: "content",
    label: "Content",
    items: [
      {
        key: "reviews",
        label: "Reviews",
        href: AppRoute.reviews,
        icon: MessageSquareQuote,
        permission: AppPermission.REVIEW.READ,
      },
      {
        key: "campaigns",
        label: "Campaigns",
        href: AppRoute.campaigns,
        icon: Megaphone,
        permission: AppPermission.CAMPAIGN.READ,
      },
      {
        key: "videos",
        label: "Videos",
        href: AppRoute.videos,
        icon: VideoIcon,
        permission: AppPermission.VIDEO.READ,
      },
      {
        key: "packages",
        label: "Packages",
        href: AppRoute.packages,
        icon: PackageIcon,
        permission: AppPermission.PACKAGE.READ,
      },
    ],
  },
  {
    key: "recipes",
    label: "Recipes",
    items: [
      {
        key: "recipes",
        label: "Recipes",
        href: AppRoute.recipes,
        icon: ChefHat,
        permission: AppPermission.RECIPE.READ,
      },
      {
        key: "recipe-categories",
        label: "Categories",
        href: AppRoute.recipeCategories,
        icon: ListTree,
        permission: AppPermission.RECIPE_CATEGORY.READ,
      },
      {
        key: "recipe-food-groups",
        label: "Food Groups",
        href: AppRoute.recipeFoodGroups,
        icon: Salad,
        permission: AppPermission.RECIPE_FOOD_GROUP.READ,
      },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    items: [
      {
        key: "faq-sections",
        label: "Sections",
        href: AppRoute.faqSections,
        icon: ListTree,
        permission: AppPermission.FAQ_SECTION.READ,
      },
      {
        key: "faq-items",
        label: "Items",
        href: AppRoute.faqItems,
        icon: HelpCircle,
        permission: AppPermission.FAQ_ITEM.READ,
      },
    ],
  },
  {
    key: "site-configuration",
    label: "Site Configuration",
    items: [
      {
        key: "site-settings",
        label: "Site Settings",
        href: AppRoute.siteSettings,
        icon: Globe,
        permission: AppPermission.SITE_SETTINGS.READ_ONE,
      },
      {
        key: "doctor-profile",
        label: "Doctor Profile",
        href: AppRoute.doctorProfile,
        icon: Images,
        permission: AppPermission.DOCTOR_PROFILE.READ_ONE,
      },
      {
        key: "packages-page-settings",
        label: "Packages Page",
        href: AppRoute.packagesPageSettings,
        icon: SlidersHorizontal,
        permission: AppPermission.PACKAGES_PAGE_SETTINGS.READ_ONE,
      },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    items: [{ key: "users", label: "Users", href: AppRoute.users, icon: Users, permission: AppPermission.USER.READ }],
  },
];

// Fixed footer: user-account actions (Settings) plus Roles — kept out of the
// scrollable Administration section per explicit direction, even though
// Roles is itself an administration module, not a user-account one.
export const sideNavFooterItems: SideNavItemConfig[] = [
  { key: "roles", label: "Roles", href: AppRoute.roles, icon: ShieldCheck, permission: AppPermission.ROLE.READ },
  { key: "settings", label: "Settings", href: AppRoute.settings, icon: Settings },
];
