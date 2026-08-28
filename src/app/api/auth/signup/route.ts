import { hashPassword, signAuthToken, writeTokenCookie } from "@kira-joo/backend-toolkit-next";
import {
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_MAX_AGE_SECONDS,
} from "src/common/auth/session-cookie.constant";
import { Status } from "src/common/enums";
import { SignupDto } from "src/server/core/auth/dto/signup.dto";
import { resolveUser } from "src/server/core/auth/resolve-user";
import { createPostRoute } from "src/server/core/route-factories";
import { userRepository } from "src/server/users/users.repository";

export const dynamic = "force-dynamic";

// Public self-service signup. New users get zero roles (secure by default —
// an admin assigns roles afterward via the Users management UI) and are
// signed in immediately on success.
//
// This auto-login-after-signup behavior is an application decision, not a
// toolkit capability — nothing below this comment is toolkit-specific.
// Switching to email verification / admin approval / invite-based
// onboarding later only requires editing this one handler (e.g. skip the
// signAuthToken call and skip the cookie) — no change needed anywhere else in
// the auth layer.
export const POST = createPostRoute({
  body: SignupDto,
  auth: false,
  handler: async ({ body }) => {
    const passwordHash = await hashPassword(body.password);

    const created = await userRepository.save({
      name: body.name,
      email: body.email,
      passwordHash,
      tokenVersion: 1,
      roles: [],
      status: Status.ACTIVE,
    });

    const user = await resolveUser(String(created._id));
    const token = await signAuthToken({ sub: String(created._id), tokenVersion: 1 });

    // Set as an HttpOnly cookie, never returned in the body — see the login
    // route for why.
    await writeTokenCookie(token, {
      name: STAFF_SESSION_COOKIE,
      maxAge: STAFF_SESSION_MAX_AGE_SECONDS,
    });

    return { user };
  },
});
