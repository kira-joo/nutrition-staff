"use client";

import { SideNav } from "@kira-joo/frontend-toolkit-tailwind";
import { usePathname, useRouter } from "next/navigation";
import { requester } from "@kira-joo/frontend-toolkit-core";
import { logoutEndpoint } from "../../api/auth.endpoints";
import { sideNavFooterItems, sideNavSections } from "src/common/navigation/side-nav.config";
import { AppRoute } from "../common/routes/app-route";
import { queryClient } from "../providers/app-provider";
import { clearAuthenticatedQueries } from "@kira-joo/frontend-toolkit-core";

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

    /*
     * `clearAuthenticatedQueries`, not `queryClient.clear()` — and this call
     * site is the more dangerous of the two.
     *
     * The 401 handler follows its clear with `window.location.assign`, a full
     * document navigation that tears down the cache and every mounted component
     * anyway. `router.replace` is a SOFT navigation: the app stays mounted and
     * the cache survives, so a query in flight when logout is clicked is
     * removed mid-flight in a tree that is still rendering.
     *
     * Measured rather than assumed. Logging out with a request in flight does
     * produce `removed status=pending fetchStatus=fetching` in the cache, and
     * does NOT currently produce a visible hang — the navigation unmounts the
     * waiting components before anyone sees it. Latent, not active, and fixed
     * because it is the known-bad call that would otherwise be copied.
     */
    clearAuthenticatedQueries(queryClient);
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
