// Re-exported here so client components never import from `src/server/*`
// directly — that folder is a naming convention, not an enforced boundary
// (this repo has no `server-only` package), so nothing stops a client import
// today, but crossing it directly would blur that convention over time.
//
// `authorization-registry.ts` itself has zero server-only dependencies (just
// `createAuthorizationRegistry` from `@kira-joo/backend-toolkit-core`, a
// plain enum, and — transitively — `class-validator`/`class-transformer`,
// used elsewhere in that package's bundle). Client bundle size impact
// checked via a production build immediately after this file was introduced
// (see the phase report) — if a future dependency bump makes that no longer
// negligible, replace this re-export with a small hand-written literal
// object instead of importing the live registry value.
export { AppPermission } from "../../server/core/authorization/authorization-registry";
