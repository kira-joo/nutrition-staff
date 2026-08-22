# 06 — Organization, branches, and the path to tenancy

**Status: APPROVED 2026-08-22.** Phase 3.

## Purpose

Introduce the organizational structure a multi-branch clinic needs, replace the
four "one clinic, one website" settings singletons, and make row-level SaaS
tenancy a later resolver change rather than a 50-collection migration.

## Current state

There is no tenancy of any kind. `grep -niE "tenantId|orgId|clinicId|branchId" src`
returns **0 hits**; not one of the 24 collections carries a scope field. The
word "clinic" appears only in comments. Per-deployment isolation today would be
`MONGODB_DB` alone (`src/server/core/db/connect.ts` takes a single `dbName`).

Four settings singletons hardcode singularity via
`get-or-create-singleton.ts`'s `where: {}` — `SiteSettings`, `DoctorProfile`,
`PackagesPageSettings`, `BookSettings` — across 8+ route call sites, with no
database-level uniqueness guard. "Singleton" is purely a convention.

Timezone (`Africa/Cairo`) and currency (`EGP`, a one-member enum) are
compile-time constants.

## Target state

### The decision, and why it is not the obvious one

**One `Organization` row per deployment, `organizationId` on every schema from
day one.** Not full row-level SaaS tenancy now; not DB-per-tenant with no org
entity.

| Option | Verdict |
|---|---|
| Org/Branch entities, single-tenant deploy ✅ | Gets branches, rooms and resources — which the scheduling module needs in v1 regardless of tenancy — replaces the singleton hack with real settings, and makes the SaaS switch a resolver change. Cost now is one required indexed field per schema, which is nearly free on empty collections. |
| Full row-level SaaS now | Every route, every `where`, cross-tenant leak tests, tenant-scoped cache tags, tenant-scoped sequences. Materially larger Phases 0–2 for a capability with no current customer. |
| DB-per-tenant, no org entity | Cheapest today, but branches/rooms/resources and per-clinic settings still need modelling, and adding `organizationId` later means migrating 50 collections with a migration framework that does not exist yet. This is the trap. |

The asymmetry is the whole argument: adding the column now costs a day; adding
it after there is production patient data across 50 collections costs a quarter
and risks the data.

### Entities

`Organization`, `Branch`, `Resource` — full field lists in
[04](04-domain-model.md) §1.

`Organization` absorbs what the singletons should have owned all along: clinic
identity and contact, timezone, currency, locale, branding for white-label,
MRN format, operational defaults (appointment slot length, invoice numbering,
follow-up SLA, no-show policy), and the `features` array listing enabled
verticals.

### Organization resolution

A request-scoped ambient context, mechanically the same pattern as the
transaction session in [05](05-transactions-and-data-integrity.md), and
deliberately so — one `AsyncLocalStorage`-based `RequestContext` carries both.

```ts
// core/request-context/
export interface RequestContext {
  organizationId: string;
  actor: { userId: string; roleNames: string[]; permissions: string[] };
  branchId?: string;          // the actor's working branch, from a header or a preference
  requestId: string;
}
export function runWithRequestContext<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T>;
export function getRequestContext(): RequestContext;      // throws if absent
export function tryGetRequestContext(): RequestContext | null;
```

Resolution order, single-tenant today:

1. `AuthConfig.resolveUser` already loads the `User` with populated roles. It
   gains `organizationId` on the returned shape.
2. A thin wrapper around the route factories (`core/route-factories.ts` is
   already a 6-line re-export — the natural seam) opens the context before the
   handler and closes it after.
3. For public routes (`auth: false`) there is no user, so the org resolves from
   a single-org lookup, cached at module level. When SaaS arrives this becomes a
   host/subdomain lookup and **nothing else changes**.

The `requestId` also gives `AuditEvent` a correlation key, which the codebase
has no equivalent of today.

### How `organizationId` reaches the repository

**This section was rewritten after Codex review, which found the first design was
not a tenant boundary at all.** Three defects, all verified against the code.

**Defect 1 — a caller-controlled opt-out is not a boundary.** The first draft put
`skipOrganizationScope: true` on the ordinary repository criteria, which reduces a
catastrophic cross-tenant read to one boolean any request-path file can set.

**Defect 2 — `required: true` does not prevent a caller supplying another
tenant's id**, and nothing stopped an update from *changing* `organizationId`.

**Defect 3 — populate is completely unscoped.** Verified:
`execute-find-query.ts:28` passes each populate node straight to
`query.populate(node)`, and `PopulateNode` has no `match` field. Populate issues
a **secondary query that never passes through the related repository's scope
resolver**, so a corrupted or attacker-influenced foreign key populates another
organization's document. This was the most serious finding in the whole review.

The corrected design:

**0. On enforcement, honestly.** The boundary rule below is an ESLint rule, and
ESLint can be disabled inline with a comment. It is therefore a *review* control,
not a security control: its job is to make an unscoped repository import
impossible to add *accidentally* and impossible to miss in a diff. The controls
that do not depend on discipline are the ones in points 2–4 — stamping from
context, immutability, compound uniqueness, and per-method invariant tests. A
`// eslint-disable` on a global-repository import is a deliberate act that shows
up in review; the standalone QA check (`check-import-boundaries.ts`) does not
honour inline disables, so CI fails on it regardless.

**1. Two repository types, not one with an escape hatch.**

```
createScopedRepository({ model, entityName })    // request path. NO opt-out.
createGlobalRepository({ model, entityName })    // bootstrap, migrations, jobs
```

`createScopedRepository` resolves `organizationId` from the ambient request
context and `$and`-combines it into every `where`. It has **no** parameter that
disables that. `createGlobalRepository` lives in `core/` and is importable only
from `core/bootstrap/**`, `migrations/**` and `scripts/**` — enforced by the same
ESLint boundary rule that separates the pillars
([03](03-target-architecture.md)). Request-path code cannot reach an unscoped
repository, so there is no boolean to set.

**2. Writes are stamped, not trusted.**
`organizationId` is overwritten from the request context on create, a mismatch
between a supplied value and the context is rejected outright, and the field is
**stripped from every patch** — organization ownership is immutable after
creation. `required: true` remains as the schema-level backstop.

**3. Populate is scoped, or it is not used.**
`PopulateNode` gains a `match` that `buildRelationTree` populates with the
organization predicate for every node, at every nesting depth — a real change to
`backend-toolkit-mongoose`, not a convention. A populate node against a
tenant-owned entity with no `match` is a build-time error in the relation
builder, not a runtime hope.

Verified as a tractable change: `PopulateNode` currently carries only
`{path, model, select?, populate?}`
(`relations/populate-node.interface.ts`), and `buildRelationTree` already walks
each dot-path segment by segment and merges siblings into one nested tree — so
stamping a `match` on every node it creates, at every depth, is a small addition
to one function rather than a redesign.

**One consequence to handle explicitly**, because Mongoose's `match` behaves
asymmetrically and it is caller-visible:

| Ref shape | A match-miss produces |
|---|---|
| Single ref (`practitionerId`) | the populated field is **`null`** |
| Array of refs (`branchIds`) | the offending element is **silently filtered out** of the array |

Neither leaks data, which is the point. But both are states the calling code did
not previously have to consider — a required single ref coming back `null` could
crash a template that assumed it was present. So a `null` populated **required**
ref is treated as a **data-integrity error**: logged loudly with the ids
involved, surfaced as a 500 rather than a partial render, because it means either
a cross-tenant foreign key exists in the data or the scope is misconfigured, and
both need a human. Silently rendering "unknown practitioner" would hide exactly
the condition this mechanism exists to detect.

**4. Uniqueness is compound, everywhere.**
Adding an `organizationId` index is not enough. Every unique index on a
tenant-owned entity becomes compound with `organizationId`: MRN, invoice number,
encounter number, branch code, service code, employee code, appointment-type
code, slug-like keys, and the sequence names themselves. A global unique index on
a tenant-owned field is a tenancy bug, and the migration reviews all of them
rather than adding a field beside them.

**5. Aggregation is not covered by a prepended `$match`.**
`$lookup`, `$unionWith`, `$graphLookup` and nested pipelines read other
collections independently, and a root-level tenant match does nothing for them.
See [16](16-dashboard-and-reporting.md) and
[19](19-toolkit-and-package-changes.md): the `aggregate()` primitive is labelled
**raw and unscoped**, is available only on the global repository, and any
request-path aggregate must go through explicitly scoped builders that inject the
tenant predicate into every participating collection.

**The complete operation matrix** — which repository surfaces are scoped, which
are unscoped-by-design, and which are unavailable on the scoped type — is a
required deliverable of Phase 3, published in the package README, because "we
scoped the obvious ones" is how tenant leaks happen.

### Replacing the singletons

`get-or-create-singleton.ts` is **retired**, not generalised. The four settings
records become:

| Old | New |
|---|---|
| `SiteSettings` (clinic identity half) | `Organization.contact`, `.currency`, `.timezone`, `.branding` |
| `SiteSettings` (website half: SEO, ogImage, socialLinks, activeCampaignId) | **stays** as a `site-cms/` record, now carrying `organizationId` |
| `DoctorProfile` | **stays** as `site-cms/` marketing content, org-scoped |
| `PackagesPageSettings` | **stays** as `site-cms/`, org-scoped |
| `BookSettings` | **stays** in `books/`, org-scoped |

So the singleton *pattern* dies; the four records survive as org-scoped rows
found by `{organizationId}` rather than by `{}`. That keeps every public
endpoint's response shape identical, which is what protects `nutrition-client`.

Also retired: `src/common/config/app-timezone.constant.ts` as the source of
truth. `DateTimeConfig.timeZone` is still set once at both entry points, but
from `Organization.timezone`, and any per-branch override resolves at the query
site via the existing `toolkit-common` zone helpers, which already take an
explicit `timeZone` argument.

### Branch scoping

Branch is **not** a second tenancy axis. It is a filter and a default:

- `Appointment`, `Encounter`, `Invoice`, `Payment`, `Resource`,
  `WaitingListEntry` require `branchId`. `Patient` has an advisory
  `primaryBranchId`.
- A user has a working branch (a preference, switchable in the UI); it defaults
  the filters and pre-fills forms. It does **not** hide data unless a role
  carries the branch-scoped authorization variant — that is
  [07](07-authorization-roles-permissions.md)'s concern, not this document's.
- Reporting aggregates by branch and rolls up to the organization.

### What changes on the day SaaS tenancy is switched on

This is the payoff, and it is short by design:

1. The org resolver stops returning the single org and starts resolving from
   host/subdomain or from the JWT claim. **One file.**
2. `Organization` gains `plan`/`status`/limits fields.
3. Cache tags gain an org namespace — and note the `CacheTag` vocabulary is
   hand-duplicated across two repos and already drifted (L6), so this is the one
   place where the switch has real cross-repo cost.
4. `POST /api/auth/signup` must stop being `auth: false`; today anyone can mint
   an identity in the shared `users` collection, which is harmless with zero
   permissions but is a tenant-boundary problem the moment tenancy is real. The
   route's own comment says switching to invite-only "only requires editing this
   one handler."
5. Cross-tenant leak tests become mandatory: for every list endpoint, assert
   that org A's token cannot read org B's row.
6. MRN and invoice sequences are already per-organization by design, so they
   need no change.

No schema migration. That is the entire point of doing this in Phase 3.

## Scope

In: the three new entities, the request context, repository scope injection,
`organizationId` on every schema plus backfill, singleton retirement, timezone
and currency moving to data, and the branch switcher in the UI shell.

Out: multi-organization anything — no org switcher, no org provisioning UI, no
per-org billing of the product itself, no cross-org reporting.

## Migrations

M5 (`organizationId` backfill) and M6 (singleton retirement). Both in
[20](20-migration-strategy.md). M5 is additive and reversible; M6 is not, and
needs a rehearsal because it moves fields that `nutrition-client` reads.

## Edge cases

- **A record with no branch.** Org-wide settings and org-level tasks legitimately
  have none. `branchId` is nullable except where listed above.
- **Cross-branch patients.** Normal. `primaryBranchId` is advisory; a patient
  seen at any branch appears in that branch's day view via `Appointment.branchId`.
- **Branch timezones differing.** Supported (`Branch.timezone` overrides), and
  the reason `PractitionerAvailability` stores wall-clock `"HH:mm"` rather than
  UTC instants — a recurring 09:00 must remain 09:00 across a DST change.
- **Deleting a branch with history.** Soft delete only; historical appointments
  keep pointing at it.

## Testing strategy

- The context is isolated across concurrent requests (the `AsyncLocalStorage`
  test, mirroring [05](05-transactions-and-data-integrity.md) case 14).
- A scoped repository call with no ambient context **throws** rather than
  returning unscoped data. The single most important test in the phase.
- A write that omits `organizationId` fails at the schema; a write that supplies
  a *different* one is rejected; a patch containing `organizationId` has it
  stripped.
- **Per-method invariant tests, not one test of `combineFilters`.** Every scoped
  repository method — `findOne`, `findAll`, `count`, `findByIds`,
  `findAllAndCountPublic`, `findAllNoCountPublic`, `update`, `delete`,
  `softDelete`, `restore` — gets a two-org fixture asserting org A cannot reach
  org B's row. A future optimised `findByIds` that bypasses `findAll` must fail
  a test, not slip through.
- **The populate leak test:** a document whose foreign key points at another
  organization's row populates to `null`, not to the foreign document. This is
  the test that would have caught the original design.
- Nested populate, two levels deep, is scoped at both levels.
- Every compound unique index rejects a duplicate within an org and permits the
  same value across orgs.
- Request-path code cannot import the global repository (boundary check).
- The four public CMS endpoints return byte-identical shapes before and after
  singleton retirement.

## Acceptance criteria

- [ ] Every collection except `Organization` has a required, indexed
      `organizationId`, and every unique index on a tenant-owned entity is
      **compound with it**.
- [ ] The request path has **no** access to an unscoped repository and no
      scope opt-out exists on the scoped type.
- [ ] Populate is scoped at every nesting depth, proven by the cross-org
      populate test.
- [ ] `organizationId` is stamped from context, immutable, and stripped from
      patches.
- [ ] The operation matrix is published.
- [ ] `get-or-create-singleton.ts` is deleted and no `where: {}` remains.
- [ ] `APP_TIMEZONE` and the `Currency` enum are no longer sources of truth.
- [ ] Cross-org isolation tests pass with two seeded organizations.
- [ ] All 18 public endpoints unchanged; `nutrition-client` green.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict on the original design: FATALLY FLAWED. Rewritten.**

| # | Finding | Sev | Analysis | Resolution |
|---|---|---|---|---|
| 1 | A caller-controlled `skipOrganizationScope` on the ordinary repository API is not a tenant boundary — it makes a catastrophic operation one boolean away. | CRITICAL | Correct, and the original framing ("needed in exactly three places, enumerated so it can be audited") was wishful. An enumerated list is not an enforcement mechanism. | **Accepted.** Split into `createScopedRepository` (no opt-out) and `createGlobalRepository` (importable only from bootstrap/migrations/scripts, enforced by the boundary rule). |
| 2 | `combineFilters`' `$and` is correct but only protects paths that call it — nothing against `$expr`, `$where`, `$lookup`, populate or raw models. | MAJOR | Correct. Verified `combine-filters.ts:14` is sound in itself. | **Accepted.** Operation matrix now a deliverable; raw stages barred from the request path. |
| 3 | `required: true` only proves *some* org id exists — a caller can supply another tenant's, and updates can change it. | CRITICAL | Correct. A real hole. | **Accepted.** Stamped from context on create, mismatch rejected, stripped from patches, immutable thereafter. |
| 4 | **Populate is unscoped** — the populate tree goes straight to Mongoose and its secondary query never passes through the related repository's scope resolver. | CRITICAL | **Verified**: `execute-find-query.ts:28` calls `query.populate(node)` and `PopulateNode` has no `match`. The single most serious finding in the review. | **Accepted.** `PopulateNode.match` added and populated with the tenant predicate at every depth, or the relation is loaded through its own scoped repository. A tenant-owned populate node without a match is a build-time error. |
| 5 | `findByIds` is safe only because it delegates to `findAll` today; a future optimisation could bypass scope. Needs per-method invariant tests. | MAJOR | Correct — verified the delegation at `create-mongoose-repository.ts:179`. | **Accepted.** Per-method two-org invariant tests, not a single `combineFilters` unit test. |
| 6 | Prepending one `$match` does not scope `$lookup` / `$unionWith` / `$graphLookup`. | CRITICAL | Correct, and the first draft's claim that the tenant match "cannot be omitted" was false comfort. | **Accepted.** `aggregate()` relabelled raw and unscoped, global-repository-only; request-path aggregates use scoped builders. Also amended in [16](16-dashboard-and-reporting.md) and [19](19-toolkit-and-package-changes.md). |
| 7 | Counts, distinct, bulk writes, migrations, change streams and raw model access all remain leak paths, and the planned API expansion widens the surface. | MAJOR | Correct. | **Accepted.** The published operation matrix is now a Phase 3 deliverable. |
| 8 | A module-level cached single-org lookup is wrong for future SaaS — caches survive deploys and must key by canonical host with eviction. | MAJOR | Correct. | **Accepted.** An explicit resolver interface with cache keys and invalidation, from day one. |
| 9 | Compound uniqueness must include `organizationId` everywhere — adding a standalone index is insufficient. | MAJOR | Correct, and the first draft only said "indexed". | **Accepted.** Every unique index on a tenant-owned entity is compound; the migration reviews all of them. |

**Rejected nothing in this area.** The original design was materially unsafe and
the review was right on every point.

**A follow-up review of this rewrite has not yet run** — the Codex usage limit was
reached immediately after the first pass. The rewrite therefore carries the
first review's findings but has not itself been independently attacked. The
questions queued for it: does Mongoose's populate `match` behave as needed for
single refs, arrays of refs and nested populate (the asymmetry above is from the
documented behaviour, not from an independent check); is an ESLint rule plus a
CI check an adequate control for `createGlobalRepository`; and what leak paths
remain. **This is a known gap, not a completed review.**
