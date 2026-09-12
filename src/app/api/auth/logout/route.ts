import { eraseTokenCookie } from "@kira-joo/backend-toolkit-next";
import { STAFF_SESSION_COOKIE, STAFF_SESSION_MAX_AGE_SECONDS } from "src/common/auth/session-cookie.constant";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/**
 * Ends the session by clearing the cookie.
 *
 * Only the backend can do this now: the cookie is HttpOnly, so the client
 * cannot remove it and a client-side "logout" that only cleared local state
 * would leave the browser still sending a valid credential.
 *
 * `auth: false` on purpose. Logging out must work even when the token has
 * already expired or been revoked — requiring a valid session to end a session
 * would strand exactly the users who most need the cookie gone.
 */
export const POST = createPostRoute({
  auth: false,
  successStatus: 204,
  handler: async () => {
    await eraseTokenCookie({
      name: STAFF_SESSION_COOKIE,
      maxAge: STAFF_SESSION_MAX_AGE_SECONDS,
    });
    return undefined;
  },
});
