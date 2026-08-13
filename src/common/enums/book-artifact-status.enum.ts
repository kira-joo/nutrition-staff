/** Only the states a generation PROCESS can persist — `NOT_GENERATED`/`OUTDATED` are read-time derivations (see `resolve-artifact-state.ts`), never written here. */
export enum BookArtifactStatus {
  GENERATING = "generating",
  READY = "ready",
  FAILED = "failed",
}
