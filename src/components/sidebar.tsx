"use client";

import { SideNav } from "@kira-joo/frontend-toolkit-tailwind";
import { usePathname, useRouter } from "next/navigation";
import { requester } from "@kira-joo/frontend-toolkit-core";
import { logoutEndpoint } from "../../api/auth.endpoints";
import { sideNavFooterItems, sideNavSections } from "src/common/navigation/side-nav.config";
import { AppRoute } from "../common/routes/app-route";
import { queryClient } from "../providers/app-provider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout(): Promise<void> {
    /*
     * The cookie is HttpOnly, so only the backend can clear it. Clearing local
     * state alone would leave the browser still holding and sending a valid
     * credential — the user would appear logged out and would not be.
     *
     * A failure here is still followed by the local clear and the redirect: if
     * the request did not land, the session survives on the server, but leaving
     * the user staring at an admin UI they think they left is worse. The
     * cookie's own expiry is the backstop.
     */
    try {
      await requester(logoutEndpoint);
    } catch {
      // Intentionally ignored — see above.
    }

    queryClient.clear();
    router.replace(AppRoute.login);
  }

  return (
    <SideNav
      pathname={pathname}
      brand={{
        src: "/logo.png",
        alt: "Nutrition Staff",
        collapsedSrc: "/icon.png",
      }}
      sections={sideNavSections}
      footerItems={sideNavFooterItems}
      onLogout={() => void handleLogout()}
    />
  );
}
