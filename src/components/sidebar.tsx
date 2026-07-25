"use client";

import { useRouter, usePathname } from "next/navigation";
import { SideNav } from "@kira-joo/frontend-toolkit-tailwind";
import { sideNavFooterItems, sideNavSections } from "src/common/navigation/side-nav.config";
import { removeAccessToken } from "../common/auth/token-storage";
import { AppRoute } from "../common/routes/app-route";
import { queryClient } from "../providers/app-provider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout(): void {
    removeAccessToken();
    queryClient.clear();
    router.replace(AppRoute.login);
  }

  return (
    <SideNav
      pathname={pathname}
      brand={{ title: "Nutrition Staff" }}
      sections={sideNavSections}
      footerItems={sideNavFooterItems}
      onLogout={handleLogout}
    />
  );
}
