import type { AuthUser } from "@kira-joo/backend-toolkit-core";
import { buildRolePopulateRelations, resolveUserRoles } from "@kira-joo/backend-toolkit-mongoose";
import { userRepository } from "@/server/users/users.repository";
import { Status } from "@/common/enums";

/**
 * The app's ResolveUserFn, wired into configureNextBackendToolkit's auth
 * block. Also reused directly by the login/signup handlers so their
 * response shape always matches GET /api/auth/me.
 *
 * Returns null for an inactive user, exactly like it already does for
 * "not found" — the toolkit itself has no isActive/status concept, so
 * enforcing this is entirely this function's job. This means: an inactive
 * user's login attempt is rejected before a token is ever issued, and an
 * already-issued token for a user later deactivated stops working on their
 * very next request.
 */
export async function resolveUser(userId: string): Promise<AuthUser | null> {
  const user = await userRepository.findOne({
    where: { _id: userId },
    relations: buildRolePopulateRelations("roles"),
    skipThrowError: true,
  });

  if (!user || user.status === Status.INACTIVE) return null;

  return {
    _id: String(user._id),
    tokenVersion: user.tokenVersion,
    roles: resolveUserRoles(user.roles as unknown as Parameters<typeof resolveUserRoles>[0]),
    name: user.name,
    email: user.email,
  };
}
