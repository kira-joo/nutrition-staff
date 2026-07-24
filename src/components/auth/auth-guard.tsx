"use client";

import { useEffect, type ReactNode } from "react";
import { Spinner } from "@kira-joo/frontend-toolkit-tailwind";
import { usePathname, useRouter } from "next/navigation";
import { AppRoute } from "../../common/routes/app-route";
import { getAccessToken } from "../../common/auth/token-storage";
import { useCurrentUser } from "../../common/auth/use-current-user";

// Routes that must never be gated by this guard: the public landing page and
// the two auth pages (which apply their own, opposite GuestGuard instead —
// redirecting away if already authenticated, rather than requiring auth).
const PUBLIC_ROUTES: string[] = [AppRoute.home, AppRoute.login, AppRoute.signup];

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
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const hasToken = Boolean(getAccessToken());
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!isPublicRoute && (!hasToken || isError)) {
      router.replace(AppRoute.login);
    }
  }, [isPublicRoute, hasToken, isError, router]);

  if (isPublicRoute) return <>{children}</>;

  if (!hasToken || isError) return null;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
