"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getAccessToken } from "../../common/auth/token-storage";
import { AppRoute } from "../../common/routes/app-route";

/** Wraps public-only pages (login/signup) — redirects away if already authenticated. */
export function GuestGuard({ children }: { children: ReactNode }) {
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
