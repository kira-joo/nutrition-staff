import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type {
  AuthResponse,
  LoginDto,
  SignupDto,
  CurrentUser,
  UpdateOwnPasswordDto,
} from "../src/common/interfaces/auth.interface";

// Backed by the route handlers under src/app/api/auth.

export const loginEndpoint: Endpoint<{ body: LoginDto; returnType: AuthResponse }> = {
  url: "/auth/login",
  methodType: MethodType.POST,
};

export const signupEndpoint: Endpoint<{ body: SignupDto; returnType: AuthResponse }> = {
  url: "/auth/signup",
  methodType: MethodType.POST,
};

/**
 * Ends the session.
 *
 * Only the backend can clear an HttpOnly cookie, so logout is a request rather
 * than a local state change. Clearing the client cache alone would leave the
 * browser still holding — and sending — a valid credential.
 */
export const logoutEndpoint: Endpoint<{ returnType: void }> = {
  url: "/auth/logout",
  methodType: MethodType.POST,
};

export const getCurrentUserEndpoint: Endpoint<{ returnType: CurrentUser }> = {
  url: "/auth/me",
  methodType: MethodType.GET,
};

export const updateOwnPasswordEndpoint: Endpoint<{ body: UpdateOwnPasswordDto; returnType: { success: boolean } }> = {
  url: "/auth/me/password",
  methodType: MethodType.PUT,
};
