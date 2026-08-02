import { clientProfileRepository } from "src/server/clients/client-profiles.repository";

/**
 * `assignedToUserId` lives on `ClientProfile` directly, but the historical
 * collections (Measurement/Assessment/Calculation/Interaction) only carry a
 * `clientProfileId` — this resolves the staff filter into the matching set
 * of profile ids those collections can actually filter by. Returns
 * `undefined` when no staff filter is active ("no scoping needed"), not an
 * empty array ("scope to nothing").
 */
export async function resolveScopedClientProfileIds(assignedToUserId?: string): Promise<string[] | undefined> {
  if (!assignedToUserId) return undefined;
  const profiles = await clientProfileRepository.findAll({ where: { assignedToUserId }, select: { _id: true } });
  return profiles.map((profile) => String(profile._id));
}

/** Merges the staff filter into a `ClientProfile` query's `where`. */
export function withAssignedStaffWhere(where: Record<string, unknown>, assignedToUserId?: string): Record<string, unknown> {
  return assignedToUserId ? { ...where, assignedToUserId } : where;
}

/** Merges a resolved staff-scope (see `resolveScopedClientProfileIds`) into a historical collection's `where`. */
export function withScopedClientWhere(where: Record<string, unknown>, scopedClientProfileIds?: string[]): Record<string, unknown> {
  return scopedClientProfileIds ? { ...where, clientProfileId: { $in: scopedClientProfileIds } } : where;
}
