import type { AuthUser, ResolvedRole } from "@kira-joo/frontend-toolkit-core";

export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
}

/**
 * The authenticated-user shape shared by login, signup, and GET /api/auth/me.
 * Extends the toolkit's `AuthUser` rather than duplicating it, so
 * `@kira-joo/frontend-toolkit-core` stays the single source of truth for the
 * authenticated-user model — `hasPermission`/`PermissionGuard` accept this
 * directly, with no adapter/mapping layer.
 */
export interface CurrentUser extends AuthUser {
  _id: string;
  tokenVersion: number;
  roles: ResolvedRole[];
  name: string;
  email: string;
}

/**
 * What login and signup return.
 *
 * **No token.** The session is an HttpOnly cookie the backend sets with
 * `Set-Cookie`; returning it in the body as well would hand JavaScript a copy
 * of the exact credential the cookie exists to keep out of reach.
 */
export interface AuthResponse {
  user: CurrentUser;
}

export interface UpdateOwnPasswordDto {
  currentPassword: string;
  newPassword: string;
}
