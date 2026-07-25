"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { useMounted } from "@kira-joo/frontend-toolkit-tailwind";
import { getCurrentUserEndpoint } from "../../../api/auth.endpoints";
import { getAccessToken } from "./token-storage";

/**
 * Resolves the current authenticated user via GET /api/auth/me. The mere
 * presence of a stored token is never treated as proof of authentication —
 * this hook is what actually confirms the token is still valid.
 *
 * `enabled` is gated on `useMounted()`, not just `Boolean(getAccessToken())`
 * directly — localStorage doesn't exist during SSR, so a render-time read of
 * it would return `null` on the server but the real token synchronously on
 * the client's first (pre-hydration) render, causing a hydration mismatch in
 * every consumer downstream (Sidebar's nav-item filtering, PermissionGuard,
 * etc.). Gating on `mounted` (false during SSR and the client's first render
 * alike, flipping true only inside a post-mount effect) guarantees identical
 * output until hydration is done, then reveals the real state.
 *
 * Called from many places now (AuthGuard, the permission context bridge,
 * Sidebar, list pages, forms, ...) — most of which mount/unmount on every
 * route navigation. Without staleTime, TanStack's default (0, refetch on
 * every mount) would re-fetch /me on every navigation. This data is only
 * ever invalidated by a real session change (login populates a fresh token;
 * onUnauthorized clears the whole query cache on a 401) — never by route
 * navigation — so it's treated as effectively stable for the session.
 */
export function useCurrentUser() {
  const mounted = useMounted();

  return useRequesterQuery({
    endpoint: getCurrentUserEndpoint,
    queryOptions: {
      enabled: mounted && Boolean(getAccessToken()),
      retry: false,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  });
}
