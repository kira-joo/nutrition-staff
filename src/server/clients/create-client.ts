import { ValidationFailedError } from "@kira-joo/backend-toolkit-core";
import { ClientLifecycle, Status } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { CreateClientDto } from "src/server/clients/dto/create-client.dto";
import { userRepository } from "src/server/users/users.repository";

/**
 * Creates the `User` + `ClientProfile` pair together. Not a real database
 * transaction (this app has none — see `nutrition-staff/PLAN.md`'s own
 * established conventions, no precedent for Mongoose sessions anywhere in
 * this codebase); instead, a `ClientProfile` failure after the `User` was
 * created rolls back by hard-deleting that just-created `User`, since a
 * `User` created by this flow should never exist without its profile.
 *
 * Exact-match phone/email duplicate detection runs first (the soft, UX-level
 * backstop) — the sparse-unique indexes on `User.phone`/`User.email` remain
 * the hard DB-level backstop regardless.
 */
export async function createClient(body: CreateClientDto) {
  const existing = await userRepository.findOne({
    where: { $or: [{ phone: body.phone }, ...(body.email ? [{ email: body.email }] : [])] },
    skipThrowError: true,
  });

  if (existing) {
    const field = existing.phone === body.phone ? "phone" : "email";
    throw new ValidationFailedError([
      {
        field,
        messages: [`A person with this ${field} already exists: "${existing.name}". Link the existing record instead of creating a duplicate.`],
      },
    ]);
  }

  const user = await userRepository.save({
    name: body.name,
    phone: body.phone,
    email: body.email,
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
