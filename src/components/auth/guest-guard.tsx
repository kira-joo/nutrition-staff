"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CenteredSpinner } from "@kira-joo/frontend-toolkit-tailwind";
import { useCurrentUser } from "../../common/auth/use-current-user";
import { AppRoute } from "../../common/routes/app-route";

/**
 * Wraps the login and signup pages — redirects away if already signed in.
 *
 * The inverse of `AuthGuard`, and it reads the same single source of truth. A
 * 401 is the SUCCESS case here: it means no session, so the page should render.
 */
function AuthenticatedRedirectGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (user) router.replace(AppRoute.home);
  }, [user, router]);

  // Waiting on the answer. Rendering the login form first and yanking it away
  // a moment later is worse than a brief spinner.
  if (isLoading) return <CenteredSpinner />;
  if (user) return null;

  // isError — no session, which is exactly who this page is for.
  void isError;
  return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  return <AuthenticatedRedirectGuard>{children}</AuthenticatedRedirectGuard>;
}
