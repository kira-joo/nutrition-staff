"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { getCurrentUserEndpoint } from "../../../api/auth.endpoints";

/**
 * Resolves the current authenticated user via `GET /api/auth/me`.
 *
 * **This is the only way the client can know whether anyone is signed in.**
 * The session token is an HttpOnly cookie, so JavaScript cannot read it, cannot
 * check it, and cannot tell a valid session from an expired one. Asking the
 * server is not a fallback here — it is the mechanism.
 *
 * That turns out to be more correct than what it replaced. The old code gated
 * on the presence of a token in `localStorage`, which was only ever a guess:
 * an expired or revoked token looked exactly like a valid one until a request
 * failed. There is no such gap now — a 401 from this endpoint is the answer.
 *
 * It also removes a hydration hazard. Reading `localStorage` during render
 * returned `null` on the server and the real token on the client's first
 * render, so every downstream consumer risked a mismatch; the old code needed a
 * `useMounted()` gate purely to paper over that. A cookie is never read in
 * render, so both passes agree and the gate is gone.
 *
 * Called from many places that mount and unmount on every navigation, so
 * `staleTime: Infinity` keeps it from refetching on each route change. Only a
 * real session change invalidates it — login refetches, and `onUnauthorized`
 * clears the whole cache on a 401.
 */
export function useCurrentUser() {
  return useRequesterQuery({
    endpoint: getCurrentUserEndpoint,
    queryOptions: {
      // No `enabled` gate. There is nothing to check locally, and a 401 is a
      // legitimate, expected answer rather than an error to avoid provoking.
      retry: false,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  });
}
