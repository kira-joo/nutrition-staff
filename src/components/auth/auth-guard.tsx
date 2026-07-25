"use client";

import { useEffect, type ReactNode } from "react";
import { CenteredSpinner, ClientOnly } from "@kira-joo/frontend-toolkit-tailwind";
import { usePathname, useRouter } from "next/navigation";
import { AppRoute } from "../../common/routes/app-route";
import { getAccessToken } from "../../common/auth/token-storage";
import { useCurrentUser } from "../../common/auth/use-current-user";

// Routes that must never be gated by this guard: the public landing page and
// the two auth pages (which apply their own, opposite GuestGuard instead —
// redirecting away if already authenticated, rather than requiring auth).
const PUBLIC_ROUTES: string[] = [AppRoute.home, AppRoute.login, AppRoute.signup];

/**
 * Only ever rendered client-side, after mount (inside ClientOnly) — so it can
 * read localStorage/call useCurrentUser() directly with no hydration-mismatch
 * risk of its own.
 */
function AuthenticatedRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasToken = Boolean(getAccessToken());
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!hasToken || isError) {
      router.replace(AppRoute.login);
    }
  }, [hasToken, isError, router]);

  if (!hasToken || isError) return null;
  if (isLoading || !user) return <CenteredSpinner className="min-h-[50vh]" />;

  return <>{children}</>;
}

/**
 * Mounted once, at the root layout — this is the single, global route guard
 * for the whole app (there is no per-feature/per-route guard anywhere else).
 * The backend remains the actual security boundary (every protected route
 * enforces its own auth/permission checks); this component only exists for
 * UX — redirecting an unauthenticated visitor to the login page instead of
 * letting protected requests fail one-by-one in the background.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ROUTES.includes(pathname)) return <>{children}</>;

  return (
    <ClientOnly fallback={<CenteredSpinner className="min-h-[50vh]" />}>
      <AuthenticatedRouteGuard>{children}</AuthenticatedRouteGuard>
    </ClientOnly>
  );
}
