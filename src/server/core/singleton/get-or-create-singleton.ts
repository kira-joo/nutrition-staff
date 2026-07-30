import type { DeepPartial, MongooseRepository } from "@kira-joo/backend-toolkit-mongoose";

/**
 * Reads the one-and-only document a singleton repository ever holds
 * (SiteSettings, DoctorProfile, PackagesPageSettings — no toolkit change
 * needed: this is app-specific orchestration, not a cross-boundary
 * contract), auto-creating it from `defaults` on first access. There is no
 * dedicated "singleton repository" concept — just a normal
 * `createMongooseRepository()` that this helper always queries/creates
 * with an empty `where`, since exactly one document is ever allowed to
 * exist.
 */
export async function getOrCreateSingleton<T>(
  repository: Pick<MongooseRepository<T>, "findOne" | "save">,
  defaults: DeepPartial<T>
): Promise<T> {
  const existing = await repository.findOne({ where: {}, skipThrowError: true });
  if (existing) return existing;
  return repository.save(defaults);
}

/** Same one-document convention as {@link getOrCreateSingleton}, for a write: updates the document if it already exists, otherwise creates it from `patch`. */
export async function upsertSingleton<T>(
  repository: Pick<MongooseRepository<T>, "findOne" | "update" | "save">,
  patch: DeepPartial<T>
): Promise<T> {
  const existing = await repository.findOne({ where: {}, skipThrowError: true });
  if (existing) return repository.update({ where: {} }, patch);
  return repository.save(patch);
}
