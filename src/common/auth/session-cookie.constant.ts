/**
 * The staff session cookie.
 *
 * Distinct from any other application's cookie name on the same registrable
 * domain. Two audiences sharing a name overwrite each other, and the failure
 * mode is one silently authenticated as the other.
 */
export const STAFF_SESSION_COOKIE = "nutrition_staff_session";

/**
 * How long the cookie lives, in seconds.
 *
 * Matches the JWT's own lifetime. A cookie outliving its token leaves the
 * browser sending a credential the server always rejects, which reads to the
 * user as a random logout rather than an expiry.
 */
export const STAFF_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
