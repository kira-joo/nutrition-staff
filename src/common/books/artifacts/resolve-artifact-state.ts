import { BookArtifactStatus } from "src/common/enums";

export type ArtifactUiState = "NOT_GENERATED" | "GENERATING" | "READY" | "FAILED" | "OUTDATED";

/** A `GENERATING` row older than this is treated as failed — a killed process leaves no other signal, and this needs no scheduler/dead-letter handling to recover from it. */
const STALE_AFTER_MS = 10 * 60 * 1000;

export interface ArtifactStateInput {
  status: BookArtifactStatus;
  templateVersion: string;
  startedAt: Date | string;
}

/**
 * Derives the 5 UI-facing states from the 3 persisted ones — `NOT_GENERATED`
 * (no row) and `OUTDATED` (a `READY` row whose `templateVersion` no longer
 * matches the edition's own frozen `templateVersion`) are never written to
 * the database, only computed at read time. Lives in `src/common` (not
 * `src/server`) so both the server (the generation route) and the staff
 * Editions UI derive the exact same state from the exact same row —
 * mirroring `resolveBookIdentity`'s reasoning.
 */
export function resolveArtifactState(row: ArtifactStateInput | null, currentTemplateVersion: string, now: Date = new Date()): ArtifactUiState {
  if (!row) return "NOT_GENERATED";

  if (row.status === BookArtifactStatus.FAILED) return "FAILED";

  if (row.status === BookArtifactStatus.GENERATING) {
    const startedAt = typeof row.startedAt === "string" ? new Date(row.startedAt) : row.startedAt;
    const ageMs = now.getTime() - startedAt.getTime();
    return ageMs > STALE_AFTER_MS ? "FAILED" : "GENERATING";
  }

  return row.templateVersion === currentTemplateVersion ? "READY" : "OUTDATED";
}
