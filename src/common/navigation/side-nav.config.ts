import { Globe, Home, Images, MessageSquareQuote, Settings, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import type { SideNavItemConfig, SideNavSectionConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { AppPermission } from "src/common/authorization/app-permission";
import { AppRoute } from "src/common/routes/app-route";

export const sideNavSections: SideNavSectionConfig[] = [
  {
    key: "general",
    items: [{ key: "home", label: "Home", href: AppRoute.home, icon: Home }],
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
