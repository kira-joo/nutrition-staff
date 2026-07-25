"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { getCurrentUserEndpoint } from "../../../api/auth.endpoints";
import { getAccessToken } from "./token-storage";

/**
 * Resolves the current authenticated user via GET /api/auth/me. The mere
 * presence of a stored token is never treated as proof of authentication —
 * this hook is what actually confirms the token is still valid.
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
  return useRequesterQuery({
    endpoint: getCurrentUserEndpoint,
    queryOptions: {
      enabled: Boolean(getAccessToken()),
      retry: false,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  });
}
