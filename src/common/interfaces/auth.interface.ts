export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
}

/** A single resolved role, exactly as GET /api/auth/me and the login/signup responses return it. */
export interface CurrentUserRole {
  name: string;
  grantsAll: boolean;
  permissions: string[];
}

/** The authenticated-user shape shared by login, signup, and GET /api/auth/me. */
export interface CurrentUser {
  _id: string;
  tokenVersion: number;
  roles: CurrentUserRole[];
  name: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: CurrentUser;
}
