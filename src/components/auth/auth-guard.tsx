"use client";

import { useEffect, type ReactNode } from "react";
import { CenteredSpinner } from "@kira-joo/frontend-toolkit-tailwind";
import { usePathname, useRouter } from "next/navigation";
import { AppRoute } from "../../common/routes/app-route";
import { useCurrentUser } from "../../common/auth/use-current-user";

// Routes that must never be gated: the public landing page and the two auth
// pages, which apply the opposite GuestGuard instead.
const PUBLIC_ROUTES: string[] = [AppRoute.home, AppRoute.login, AppRoute.signup];

/**
 * Mounted once at the root layout — the single global route guard.
 *
 * **The backend remains the security boundary.** Every protected route enforces
 * its own auth and permission checks server-side; this exists only so an
 * unauthenticated visitor lands on the login page instead of watching protected
 * requests fail one by one in the background.
 *
 * Session state comes entirely from `GET /api/auth/me`, because the token is an
 * HttpOnly cookie and there is nothing for the client to inspect. The old
 * `ClientOnly` wrapper is gone with it: it existed to defer a `localStorage`
 * read past hydration, and nothing is read during render any more.
 */
function AuthenticatedRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    // A 401 here means no valid session — expired, revoked, or never present.
    if (isError) router.replace(AppRoute.login);
  }, [isError, router]);

  if (isError) return null;
  if (isLoading || !user) return <CenteredSpinner className="min-h-[50vh]" />;

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) return <>{children}</>;

  return <AuthenticatedRouteGuard>{children}</AuthenticatedRouteGuard>;
}
