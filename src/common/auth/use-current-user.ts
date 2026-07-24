"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { getCurrentUserEndpoint } from "../../../api/auth.endpoints";
import { getAccessToken } from "./token-storage";

/**
 * Resolves the current authenticated user via GET /api/auth/me. The mere
 * presence of a stored token is never treated as proof of authentication —
 * this hook is what actually confirms the token is still valid.
 */
export function useCurrentUser() {
  return useRequesterQuery({
    endpoint: getCurrentUserEndpoint,
    queryOptions: { enabled: Boolean(getAccessToken()), retry: false },
  });
}
