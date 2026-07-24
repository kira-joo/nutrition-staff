import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { AuthResponse, LoginDto, SignupDto, CurrentUser } from "../src/common/interfaces/auth.interface";

// Backed by the route handlers under src/app/api/auth.

export const loginEndpoint: Endpoint<{ body: LoginDto; returnType: AuthResponse }> = {
  url: "/auth/login",
  methodType: MethodType.POST,
};

export const signupEndpoint: Endpoint<{ body: SignupDto; returnType: AuthResponse }> = {
  url: "/auth/signup",
  methodType: MethodType.POST,
};

export const getCurrentUserEndpoint: Endpoint<{ returnType: CurrentUser }> = {
  url: "/auth/me",
  methodType: MethodType.GET,
};
