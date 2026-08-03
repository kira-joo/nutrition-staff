import { ConflictError } from "@kira-joo/backend-toolkit-core";
import { ClientLifecycle, Status } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { CreateClientDto } from "src/server/clients/dto/create-client.dto";
import { userRepository } from "src/server/users/users.repository";

/** Whitespace-trimmed, case-insensitive for email (phone has no established formatting convention in this app to normalize further). */
function normalizePhone(phone: string): string {
  return phone.trim();
}
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Creates the `User` + `ClientProfile` pair together. Not a real database
 * transaction (this app has none — see `nutrition-staff/PLAN.md`'s own
 * established conventions, no precedent for Mongoose sessions anywhere in
 * this codebase); instead, a `ClientProfile` failure after the `User` was
 * created rolls back by hard-deleting that just-created `User`, since a
 * `User` created by this flow should never exist without its profile.
 *
 * Exact normalized phone/email duplicate detection runs first (the soft,
 * UX-level backstop) — the sparse-unique indexes on `User.phone`/
 * `User.email` remain the hard DB-level backstop regardless. A match is
 * reported as a 409 Conflict (not a generic validation error) with enough
 * structured detail — the matched user, and whether they already have a
 * client profile — for the frontend to offer attaching a profile to that
 * existing identity instead of just failing.
 */
export async function createClient(body: CreateClientDto) {
  const normalizedPhone = normalizePhone(body.phone);
  const normalizedEmail = body.email ? normalizeEmail(body.email) : undefined;

  const existingUser = await userRepository.findOne({
    where: { $or: [{ phone: normalizedPhone }, ...(normalizedEmail ? [{ email: normalizedEmail }] : [])] },
    skipThrowError: true,
  });

  if (existingUser) {
    const field = existingUser.phone === normalizedPhone ? "phone" : "email";
    const existingClientProfile = await clientProfileRepository.findOne({ where: { userId: existingUser._id }, skipThrowError: true });

    throw new ConflictError(`A person with this ${field} already exists: "${existingUser.name}".`, {
      field,
      existingUserId: String(existingUser._id),
      existingUserName: existingUser.name,
      hasClientProfile: Boolean(existingClientProfile),
      clientProfileId: existingClientProfile ? String(existingClientProfile._id) : undefined,
    });
  }

  const user = await userRepository.save({
    name: body.name,
    phone: normalizedPhone,
    email: normalizedEmail,
    status: Status.ACTIVE,
  });

  try {
    return await clientProfileRepository.save({
      userId: user._id,
      lifecycle: ClientLifecycle.LEAD,
      source: body.source,
      sourceNote: body.sourceNote,
      assignedToUserId: body.assignedToUserId,
      tags: [],
    });
  } catch (error) {
    await userRepository.delete({ where: { _id: user._id }, skipThrowError: true });
    throw error;
  }
}
