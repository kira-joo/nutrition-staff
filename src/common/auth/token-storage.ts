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
export function getAccessToken(): string | null {
  return localStorageManager.get<string>(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(accessToken: string): void {
  localStorageManager.set(ACCESS_TOKEN_STORAGE_KEY, accessToken);
}

export function removeAccessToken(): void {
  localStorageManager.remove(ACCESS_TOKEN_STORAGE_KEY);
}
