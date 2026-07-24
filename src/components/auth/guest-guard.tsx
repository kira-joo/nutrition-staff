"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppRoute } from "../../common/routes/app-route";
import { getAccessToken } from "../../common/auth/token-storage";

/** Wraps public-only pages (login/signup) — redirects away if already authenticated. */
export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hasToken = Boolean(getAccessToken());

  useEffect(() => {
    if (hasToken) {
      router.replace(AppRoute.users);
    }
  }, [hasToken, router]);

  if (hasToken) return null;

  return <>{children}</>;
}
