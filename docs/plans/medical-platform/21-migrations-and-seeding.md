# 21 — The migration framework and seeding

**Status: APPROVED 2026-08-22.** Phase 0B.

## Purpose

Build the migration infrastructure the nine migrations in
[20](20-migration-strategy.md) need, and the seed data every later phase's tests
and performance targets depend on.

## Current state

**There is no migration framework.** No `migrations/` directory, no version or
changelog collection, no ordering, no up/down, no idempotency framework, no
record of what has run in any environment. Seven hand-written one-off `tsx`
scripts invoked manually via `node --env-file=.env --import tsx`.

Two patterns exist, both documented as deliberate:

**A. HTTP-API content import** — `migrate-client-content.ts` (536 lines),
`migrate-reviews-videos.ts` (346), `migrate-site-configuration.ts` (722):
**1,604 lines** that log in through the real `/api/auth/login`, read hardcoded
content out of the sibling `nutrition-client` checkout, and POST through the real
authenticated API so validation and Cloudinary upload paths apply. Idempotency is
per-script against a chosen natural key (`Package.key`; `title.en` scoped to a
section for FAQ; `sourceUrl` for reviews; `externalUrl + title.en` for videos,
documented because `externalUrl` alone collides on a known upstream data bug).
`migrate-site-configuration.ts` is the most careful of the three — singleton-aware,
three-way per-field (fill-if-empty / matched / **CONFLICT and leave untouched**),
and it documents five deliberately-unmigrated gaps. Two support `--dry-run`;
`migrate-client-content.ts` does **not**.

**B. Direct-Mongo shape migration** — `migrate-staff-profiles.ts`,
`sync-user-indexes.ts`, and the `migrateExistingUsers` half of
`seed-roles-and-permissions.ts`. These bypass Mongoose models via
`Model.collection` **specifically because the fields being migrated no longer
exist on the schema** and strict mode would strip them.

`sync-user-indexes.ts` is worth singling out: it exists because Mongoose's
`autoIndex` only *adds* missing indexes and **will not alter an existing index
whose key pattern matches but whose options differ** — so an environment
predating the sparse-unique change silently keeps enforcing plain `unique: true`
forever. It prints indexes before and after. That behaviour is the model for
every index migration.

Seeding: `seed-roles-and-permissions.ts` is idempotent (upsert by name).
`seed-users.ts` is **destructive** — `UserModel.deleteMany({})` plus
`StaffProfileModel.deleteMany({})`, then five hardcoded users sharing
`DEV_PASSWORD = "Passw0rd!"`. Because `User` has no soft delete and every
clinical record FKs to it, running it against a populated database orphans every
patient, measurement, assessment, calculation and interaction.

## Target state

### The framework

Minimal, file-based, and consistent with the conventions above rather than a
third-party tool — the existing scripts are good, they just have no spine.

```
nutrition-staff/migrations/
  0001-add-clinical-fk-indexes.ts
  0002-user-soft-delete.ts
  0003-create-organization-and-backfill.ts
  ...
```

Each migration exports:

```ts
export const meta = {
  id: "0003",
  name: "create-organization-and-backfill",
  destructive: false,
  requiresDump: false,          // true forces a recorded dump before running
  transactional: true,          // wrapped in withTransaction where the write set allows
};
export async function up(ctx: MigrationContext): Promise<MigrationReport>;
export async function down?(ctx: MigrationContext): Promise<void>;
```

`MigrationContext` provides the connection, a `dryRun` flag, a structured
logger, and the raw `Model.collection` access pattern B needs.
`MigrationReport` is a counts-and-warnings object — the thing a reviewer reads
after a dry run.

**A `migrations` collection** records `{id, name, checksum, startedAt,
finishedAt, appliedBy, environment, report}`. So "what has run here" is a query
rather than an archaeology exercise. A checksum mismatch on an already-applied
migration is a hard error, not a warning.

Runner: `npm run migrate` (pending only, in order), `npm run migrate:status`,
`npm run migrate:up -- 0003`, `npm run migrate:down -- 0003`,
and `--dry-run` on all of them. **Dry-run is mandatory, not optional** — the one
existing script that lacks it is the one that would be most dangerous to re-run.

Rules the framework enforces:

- Idempotent by construction: every migration checks its own postcondition first
  and exits cleanly if already satisfied. Proven by running each one twice in CI.
- `requiresDump: true` refuses to run without a recorded dump reference.
- **A migration never publishes cache revalidation.** Repositories are
  database-only and invalidation fires only from a real HTTP mutation — an
  existing workspace rule this framework must not break.
- Migrations run outside the request lifecycle, so there is no ambient
  organization scope. They use **`createGlobalRepository`**, which is importable
  only from `core/bootstrap/**`, `migrations/**` and `scripts/**` and is
  unreachable from request-path code. There is no scope opt-out on the scoped
  repository to reach for ([06](06-organization-and-branches.md)).
- Index migrations use explicit `dropIndex` + `syncIndexes` and print before and
  after, following `sync-user-indexes.ts`.

Deliberately not adopted: `migrate-mongo` or a similar package. The existing
scripts' patterns — HTTP-API import for content, raw-collection access for shape
changes — are both needed, and neither fits a generic tool's model well. A
~200-line runner is cheaper than bending one.

### The existing scripts

- Kept as-is, marked historical. Two of the three content importers hardcode a
  dependency on a sibling `nutrition-client` checkout and can never run
  meaningfully again; they are documented as such rather than deleted.
- `seed-roles-and-permissions.ts` is folded into the framework as migration
  `0000`, since it is genuinely a migration (it also does a legacy `$unset`).
- **`seed-users.ts` is rewritten to be non-destructive.** Its `deleteMany({})`
  is the single most dangerous line in the repository once patient data exists.
  It becomes an upsert-by-email seeder that refuses to run when the target
  database contains any `Patient` row unless `--force` is passed.

### Seed data

Three tiers, because they serve different purposes:

**Tier 1 — bootstrap (every environment, including production).**
One `Organization` from env or prompt, one `Branch`, the eight roles from
[07](07-authorization-roles-permissions.md) with their permissions, the platform
`ObservationDefinition`s, a starter `AppointmentType` set, and one `owner` user.
Idempotent, non-destructive, safe to re-run. This is what makes a fresh
deployment usable — today a fresh signup gets `roles: []` and can do nothing,
which is why `scripts/qa/grant-admin-role.ts` exists.

**Tier 2 — demo (development and sales).**
A realistic small clinic: 2 branches, 4 practitioners across 3 specialties,
6 staff across the roles, ~150 patients with plausible demographics, MRNs,
alerts and contacts, ~600 appointments spread across past and future with a
realistic mix of completed / no-show / cancelled, ~400 signed encounters with
vitals, diagnoses and prescriptions, nutrition assessments and calculations for
a subset, ~500 invoices with mixed payment states, contact attempts and tasks.

This tier is a real deliverable, not a nicety: it is what makes a demo possible,
what makes UX review meaningful (an empty dashboard reviews well and works
badly), and what the acceptance criteria for empty-versus-populated states are
checked against. Arabic names and Arabic free-text notes throughout, because
long-Arabic overflow is a live concern in this app.

**Tier 3 — scale (performance verification only).**
20,000 patients, 200,000 appointments, 150,000 encounters, 1M observations.
Generated, not curated. This is what
[16](16-dashboard-and-reporting.md)'s sub-500 ms dashboard target is measured
against — a performance claim without this dataset is an opinion. Generated in
bulk via `insertMany`, bypassing per-document middleware deliberately.

## Environments

- **Local**: a single-node replica set is now required for transactions
  ([05](05-transactions-and-data-integrity.md)). There is no container definition
  in any repo today; Phase 0 adds a documented `mongod --replSet` setup or a
  compose service, and `nutrition-staff/README.md` gains the instructions.
- **CI**: none exists in any of the nine repositories. Migration idempotency and
  the seed tiers are the strongest argument for adding one, and it is recorded as
  a recommendation in [25](25-risks-and-open-decisions.md) rather than assumed.
- **Production**: manual, Vercel-shaped. Migrations are run deliberately from a
  developer machine against the production URI, with a dump taken first. Stated
  plainly rather than pretended otherwise.

## Testing strategy

Every migration: run against a fixture, assert the exact resulting shape, run
again, assert no change · dry-run asserted to perform zero writes · checksum
mismatch detection · `down` where present, tested · tier-1 seed idempotent ·
tier-2 seed produces a dataset that satisfies every list, filter and dashboard
query without an empty state · tier-3 seed generation time bounded.

## Acceptance criteria

- [ ] `npm run migrate:status` reports accurately in every environment.
- [ ] Every migration idempotent, dry-runnable, and recorded in the `migrations`
      collection.
- [ ] `seed-users.ts` cannot destroy patient data.
- [ ] Tier 1 makes a fresh deployment immediately usable by a seeded `owner`,
      with no manual role grant.
- [ ] Tier 2 exists and is used for UX review and demos.
- [ ] Tier 3 exists and the dashboard performance target is measured against it.
- [ ] The local replica-set requirement documented in the README.

## Codex findings and resolution

Not yet consulted. Ask: is a hand-rolled ~200-line runner the right call versus
adopting `migrate-mongo`, given that this codebase genuinely needs both
HTTP-API-based and raw-collection migrations?
