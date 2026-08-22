# 07 — Authorization, roles, and permissions

**Status: APPROVED 2026-08-22.** Phase 4.

## Purpose

Turn a permission system that only `admin` can actually use into a clinical role
model with resource-scoped access, and add the audit trail a medical product
needs.

## Current state

The mechanism is good. The configuration is empty.

**Mechanism.** Pure RBAC with generated `Entity.action` keys.
`createAuthorizationRegistry({entities: EntityName})` cross-products 27 entities
× 5 default actions = **135 keys**, all `isSystem: true`.
`backend-toolkit-next`'s `RouteAuthOption` is `false | true | omitted | {permissions, permissionMode}`,
where *omitted* means secure-by-default (a `grantsAll` role only).
`hasRequiredPermissions` short-circuits on `grantsAll`, keys are
case-sensitive, default mode is `"any"`. Every route in the app uses the
explicit form with exactly one key. The frontend mirrors it with
`hasPermission(user, code)`, `PermissionGuard`, and permission strings on nav
items, row actions, table filters and route tabs.

**Configuration.** Four seeded roles: `admin` (`grantsAll: true`, permissions
`[]`), `hr` (5 User/Role keys), `manager` (4 keys), `employee` (**zero**). Not
one of the 135 keys covering `Client`, `ClientMeasurement`, `NutritionAssessment`,
`NutritionCalculation`, `ClientInteraction`, `Dashboard`, `Recipe` or `Book` is
granted to any non-`grantsAll` role. In practice **only `admin` can use the
clinical application at all** — which is why `scripts/qa/grant-admin-role.ts`
exists.

**Three structural gaps.**

1. **No resource scoping.** `authorizeUser` compares key sets and nothing else.
   `clients/[id]/route.ts` never compares `assignedToUserId` to `user._id`.
   `dashboard-scope.util.ts:12` returns "no scoping needed" when the requester
   omits the filter — so any user with `Dashboard.read` sees the whole clinic,
   or filters to any colleague's caseload at will. "Own patients only" cannot be
   expressed in the current `RouteAuthOption` shape.
2. **Only five actions exist.** `read`, `readOne`, `create`, `update`, `delete`.
   A clinic needs `Encounter.sign`, `Encounter.void`, `Invoice.void`,
   `Invoice.discount`, `Appointment.checkIn`, `Appointment.overbook`,
   `Patient.merge`, `Patient.export`, `Document.download`,
   `AuditEvent.read`. `createAuthorizationRegistry` already accepts an
   `actions?` override, so this is configuration, not a package change.
3. **No audit trail.** `grep -i audit` across all seven packages returns 0 hits.
   The only history is `ClientInteraction.isSystemGenerated` lifecycle entries.
   No field-level change record, no access log.

Also: `syncPermissions` is **insert-only** — it never updates or deletes
existing permission rows. That is a documented limitation and it matters for the
migration below.

## Target state

### The clinical role vocabulary

Seeded, and every one of them actually usable on day one. Roles are seeded per
organization.

| Role | Can | Cannot |
|---|---|---|
| `owner` | `grantsAll` | — |
| `clinic_admin` | everything operational: org/branch settings, staff, practitioners, roles, services, discounts above threshold, full reporting, audit read | delete the organization; edit a signed encounter |
| `doctor` | full clinical: read/write patients, encounters (incl. `sign`), observations, diagnoses, prescriptions, documents; own schedule; read own reporting; vertical modules for their specialties | billing beyond reading a balance; staff admin; org settings |
| `nurse` | patients (read + limited write), observations (create), documents, check-in, waiting board, prescriptions read-only | sign an encounter; diagnose; billing |
| `receptionist` | appointments (full), check-in, waiting board, patient identity create/update, invoices, payments, contact attempts, tasks | clinical content beyond alerts; encounter bodies; reporting beyond today's operations |
| `billing_clerk` | services, invoices, payments, discounts (up to threshold), financial reporting | clinical content; scheduling |
| `assistant` | tasks, contact attempts, patient reads, document upload | clinical writes; billing; scheduling changes |
| `read_only_auditor` | read across the org, plus `AuditEvent.read` | every write |

`hr`, `manager` and `employee` are retained as-is for backward compatibility and
marked deprecated in the seed, since existing users hold them.

### Resource-scoped authorization — the toolkit change

`RouteAuthOption` gains a third variant. The design question is *where* the
check runs, and the current 9-step sequence forces the answer:
`authorizeUser` runs at **step 4**, before params/body validation at **step 6**.
A record-scoped check needs validated params and usually a database read, so it
cannot live at step 4.

**Design: a two-part authorization, permission-first then scope.**

```ts
type RouteAuthOption =
  | false
  | true
  | { permissions: string[]; permissionMode?: "any" | "all" }
  | {
      permissions: string[];
      permissionMode?: "any" | "all";
      /** Runs AFTER validation, with validated params/body and the resolved user.
       *  Throws ForbiddenError to deny. */
      scope?: (ctx: RouteScopeContext) => void | Promise<void>;
    };
```

`create-route.ts` gains a **post-validation guard step**: if
`postValidationGuard` is present, invoke it after `validateRouteInputs` and
before the handler. Coarse permission checking stays at step 4.

**Two corrections from the Codex review, because the first draft overstated
this.**

**It is not authorization; it is a preflight.** A guard that reads ownership and
then hands control to a handler that re-queries has a time-of-check /
time-of-use gap: ownership can change in between. So the guard is documented as
**fast-fail UX and defence-in-depth only**, and the binding rule is:

> Authorization-relevant ownership **must** appear in the handler's own query
> filter, or be re-checked inside the mutation's transaction. A route whose only
> ownership check is the guard is incorrectly implemented.

For reads that means `findOne({_id, assignedPractitionerId: actor.practitionerId})`
— a scoped miss returns 404, which is also the information-leak-safe answer. For
writes it means the ownership predicate is part of the update's `where`, so the
write itself fails if ownership changed.

**The ordering claim was imprecise.** With a post-validation guard, a user who
holds the coarse permission but fails the scope check receives **400** for
malformed input before the guard can return 403. So the guarantee is *coarse
403 before 400*, not a universal 401 → 403 → 400. That is the correct trade —
validating identifiers before a database read is what stops the guard becoming a
probe oracle — and the deliberate decision on disclosure is: **a well-formed
identifier the actor may not see returns 404, not 403**, so existence is not
leaked.

Why a throwing guard rather than a `where`-fragment resolver:

| Option | Verdict |
|---|---|
| A post-validation guard **plus** the ownership predicate in the query ✅ | The guard gives a fast, specific 403 for the common case; the query predicate is what actually enforces it, with no TOCTOU window. Both are testable and greppable. Neither alone is sufficient, and the plan now says so. |
| A resolver returning a `where` fragment | Elegant for list routes, useless for `GET /:id` (a scoped miss becomes a 404, leaking nothing but also masking a genuine permission error), and it pushes authorization logic into query building where it is invisible. |
| Both | Chosen in effect: single-record routes use `scope`; **list** routes get their narrowing from an explicit, named scope resolver the handler calls (`resolveVisiblePatientIds(actor)`), which is testable in isolation and impossible to forget silently because the handler will not compile without it. |

Organization scoping is deliberately **not** this mechanism. Org scoping is
ambient, automatic and applies to every query
([06](06-organization-and-branches.md)); record scoping is per-route, explicit
and rule-shaped. Conflating them would make the automatic one overridable and
the explicit one invisible.

**Scope rules for v1**, each a named, unit-tested function:

- `ownPatientsOnly` — `Patient.assignedPractitionerId === actor.practitionerId`,
  or the actor has an encounter with the patient. Applied when a role holds
  `Patient.read` but not `Patient.readAll` (a new key).
- `ownBranchOnly` — the record's `branchId` ∈ the actor's `branchIds`. Applied to
  appointments, encounters, invoices for branch-limited staff.
- `ownEncountersOnly` — draft encounters are visible only to their author until
  signed.
- `selfOnly` — the existing `/api/auth/me` family.

### Audit trail

`AuditEvent` ([04](04-domain-model.md) §8) written by a `core/audit/` writer
that takes the actor from the request context — which is the reason the request
context exists at all, since the repository layer has no access to the
requesting user today.

What is generic and belongs in the toolkit: an append-only event schema shape, a
`createdBy`/`updatedBy` decorator with automatic population from an actor
context, and a repository write hook. What stays app-local: **which** entities
are audited, what the actions mean, retention, and the redaction list. Split
detailed in [19](19-toolkit-and-package-changes.md).

Audited from day one: every patient read of a *clinical* surface (encounters,
documents, observations — not list pages), every clinical write, every billing
write, every permission or role change, every login, every document download,
every scope-check denial. Denials matter as much as successes.

## Migration

M7, in Phase 4. The order matters because `syncPermissions` is insert-only.

1. Extend the registry with custom actions per entity. New keys are inserted by
   `syncPermissions`; existing rows are untouched.
2. Seed the new clinical roles **additively**. No existing role is modified in
   this step, so no user loses access at any point.
3. Grant the new keys to the new roles.
4. Assign real roles to real users (a manual, reviewed step — there are few
   users, and guessing is worse than asking).
5. Only then narrow `admin`'s reliance on `grantsAll` for day-to-day work, if at
   all. `owner` keeps `grantsAll`; it is the break-glass role.

Because `syncPermissions` never deletes, keys made obsolete by the
`Client → Patient` rename (M8) are **left in place and deactivated**
(`isActive: false`), not removed. `resolveUserRoles` already drops inactive
permissions in memory. This is what makes M8 survivable: no role reference ever
dangles.

## APIs

Existing `roles`/`permissions` routes stay. Additions: `PUT /api/roles/:id/permissions`
(replace the set, audited), `GET /api/permissions?groupBy=entity` (the flat
`<ul>` of `name (key)` on `/roles/[id]` today is unusable at 135+ keys — it
needs a grouped matrix), and `GET /api/audit-events` with filters
(`patientId`, `actorUserId`, `entityName`, date range).

## Edge cases

- **A user with two roles, one scoped and one not.** Permissions union, so the
  broader key wins. Scope rules therefore key off *keys* (`Patient.readAll`
  present ⇒ no narrowing), never off role names.
- **A doctor covering for a colleague.** `ownPatientsOnly` includes "has an
  encounter with this patient", which covers it without a delegation feature.
- **Break-glass access.** A role with `grantsAll` bypasses scope checks entirely.
  Every such access is audited, which is the control.
- **A scope check that needs a DB read on a hot list route.** Precisely why list
  routes use a named resolver returning ids, computed once, rather than a
  per-row guard.
- **`POST /api/auth/signup` is `auth: false`.** Left as-is in v1 (a fresh signup
  has zero permissions, so it is inert), flagged as a tenancy blocker in
  [06](06-organization-and-branches.md) and [25](25-risks-and-open-decisions.md).

## Testing strategy

- A permission matrix test: for each of the 8 roles × each protected route,
  assert allow/deny. Table-driven, generated from the seed, so adding a role
  cannot silently grant access.
- **A TOCTOU test per scoped mutation:** reassign the record's owner between the
  guard and the handler (by stubbing the guard to pause) and assert the write
  still fails, proving the query predicate — not the guard — carries the
  invariant.
- Each scope rule unit-tested in isolation against fixtures.
- Negative tests are the point: a `doctor` cannot read another practitioner's
  patient; a `receptionist` cannot read an encounter body; a `billing_clerk`
  cannot read a diagnosis; a scoped user cannot widen their view by supplying a
  query filter (the `dashboard-scope.util.ts` defect, as a regression test).
- An audit test per audited action, asserting the actor, entity and denial cases
  are all recorded.
- Migration test: after M7, a user holding the old `hr` role retains exactly the
  access they had before.

## Acceptance criteria

- [ ] All 8 roles seeded, each usable, none requiring `grantsAll`.
- [ ] `scripts/qa/grant-admin-role.ts` is no longer needed to exercise the app —
      a seeded `doctor` login can complete a clinical workflow end to end.
- [ ] The post-validation guard exists and runs after validation, **and** every
      scoped route carries its ownership predicate in the query itself — proven
      by the TOCTOU tests.
- [ ] A well-formed identifier the actor may not see returns 404, not 403.
- [ ] The permission-matrix test covers every protected route.
- [ ] `AuditEvent` rows exist for every audited action, including denials.
- [ ] No existing user loses access at any point during M7.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict: FLAWED. Amended.**

| # | Finding | Sev | Analysis | Resolution |
|---|---|---|---|---|
| 1 | The scope callback is a **preflight check, not secure mutation authorization** — ownership can change between the guard's read and the handler's write. | CRITICAL | Correct, and the first draft presented the guard as the answer. A factory-level throwing callback cannot guarantee it. | **Accepted.** Guard demoted to defence-in-depth; the binding rule is that ownership must be in the query filter or re-checked in the mutation's transaction. TOCTOU tests added. |
| 2 | The "401 → 403 → 400" claim is imprecise — only coarse-permission 403 precedes 400. | MAJOR | Correct. | **Accepted.** Documented precisely, and the 404-vs-403 disclosure decision is now explicit. |
| 3 | Putting `scope` in the ODM-agnostic core auth type couples it to Next's validation timing. | MAJOR | Correct. | **Accepted.** The hook moves to `backend-toolkit-next` as a generic `postValidationGuard`, not a member of the shared auth type. |
| 4 | Audit writes must not rely on ambient actor state alone — jobs, migrations and impersonation have no request actor or two. | MAJOR | Correct. | **Accepted** in [19](19-toolkit-and-package-changes.md); explicit actor on the command, ambient as default. |
| 5 | Field/projection-level authorization is missing entirely — a role may see demographics but not clinical notes, billing or IDs. | MAJOR | Correct, and a real gap: the plan had only route-level and row-level. | **Accepted as a known gap for v1, scoped rather than solved.** Entity-level omission (the existing `dashboard-permissions.util.ts` pattern) plus response-shape variants per role cover the concrete v1 cases (receptionist cannot read an encounter body; billing clerk cannot read a diagnosis). A general projection-authorization mechanism is deferred and recorded in [25](25-risks-and-open-decisions.md). |

**Still open:** whether `Patient.readAll` scales as a key or inverts into a
permission explosion; and whether read-auditing volume is sustainable (current
decision: audit document downloads, cross-scope access and encounter-body reads,
not list pages).
