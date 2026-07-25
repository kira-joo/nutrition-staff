import { localStorageManager } from "@kira-joo/frontend-toolkit-core";

const ACCESS_TOKEN_STORAGE_KEY = "nutrition_staff_access_token";

// Deliberately built directly on localStorageManager (frontend-toolkit-core's
// lower-level StorageManager), not TokenManager. Inspected TokenManager's
// actual source: it's a thin, no-extra-logic pass-through over
// StorageManager whose only real effect is mandating a fixed
// `{ accessToken: string; refreshToken?: string }` object shape — designed
// for apps that manage an access + refresh token pair together. This app has
// no refresh token (out of scope for this phase; a global logout is done via
// tokenVersion instead), so that shape would add no practical value here —
// only an extra unused key and a JSON object where a plain string would do.
// If refresh tokens are ever added, this is the one file that would change
// (e.g. switch back to TokenManager, or add a second storage key) — nothing
// else in the app touches storage directly.

// A brief earlier build of this app stored exactly this legacy shape under
// this same key (before the above decision was made) — this guards against
// stale data still sitting in a real browser's localStorage.
function isLegacyTokenObject(value: unknown): value is { accessToken: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof (value as { accessToken: unknown }).accessToken === "string"
  );
}

// Self-heals a legacy object-shaped value in place (rather than just
// clearing it), so an otherwise-still-valid session isn't forced to log out.
export function getAccessToken(): string | null {
  const value = localStorageManager.get<unknown>(ACCESS_TOKEN_STORAGE_KEY);

  if (typeof value === "string") return value;

  if (isLegacyTokenObject(value)) {
    setAccessToken(value.accessToken);
    return value.accessToken;
  }

  if (value !== null) removeAccessToken();

  return null;
}

export function setAccessToken(accessToken: string): void {
  localStorageManager.set(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function removeAccessToken(): void {
  localStorageManager.remove(ACCESS_TOKEN_STORAGE_KEY);
}
