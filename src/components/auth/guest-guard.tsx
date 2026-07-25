"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { CenteredSpinner, ClientOnly } from "@kira-joo/frontend-toolkit-tailwind";
import { getAccessToken } from "../../common/auth/token-storage";
import { AppRoute } from "../../common/routes/app-route";

/** Only ever rendered client-side, after mount (inside ClientOnly) — safe to read localStorage directly. */
function AuthenticatedRedirectGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasToken = Boolean(getAccessToken());

  useEffect(() => {
    if (hasToken) {
      router.replace(AppRoute.home);
    }
  }, [hasToken, router]);

  if (hasToken) return null;

  return <>{children}</>;
}

/** Wraps public-only pages (login/signup) — redirects away if already authenticated. */
export function GuestGuard({ children }: { children: ReactNode }) {
  return (
    <ClientOnly fallback={<CenteredSpinner />}>
      <AuthenticatedRedirectGuard>{children}</AuthenticatedRedirectGuard>
    </ClientOnly>
  );
}
