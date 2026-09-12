# Medical platform — planning workspace

Planning artifacts for evolving `nutrition-staff` from a nutrition-clinic
CRM/CMS into a reusable **Medical Clinic / Medical Center Management Platform**,
with Nutrition demoted from "the product" to "one supported vertical".

Originating brief: [`../../medical-platform-planning-brief.md`](../../medical-platform-planning-brief.md)
(untracked, authored outside this programme — treat as the product authority for
this phase, and do not edit or commit it).

**Status: APPROVED 2026-08-22.** Planning complete, internally consistent, and
approved for implementation. **No source code has been changed and no
implementation has begun.**

Approval covers the architecture, the domain model, the phase order, and every
decision in the settled-decisions table below. It does **not** authorise
implementation to start, a package publish, or a migration run — each of those
remains a separate, explicit instruction, and the toolkit releases in
[19](19-toolkit-and-package-changes.md) each require their own publish approval
per `.claude/skills/release-and-publish/SKILL.md`.

Two mandatory review gates survive approval (see below): Phase 0C and Phase 6
each require a second adversarial pass on a mechanism rewritten after the first
review. Approving the plan is not approval to skip them.

Six designs were rewritten following the Codex review of 2026-08-22 — see
[25](25-risks-and-open-decisions.md) §The Codex review for what changed and why.

> Convention note: the only pre-existing multi-file plan directory in this
> workspace lives at the workspace root (`/docs/tasks/frontend-toolkit-cleanup/`).
> The brief (§10) explicitly names `nutrition-staff/docs/plans/medical-platform/`,
> and this programme is single-repo, so the divergence is deliberate rather than
> a second accidental convention. Document structure, the `NN-topic.md` naming,
> the per-doc conventions line, and the status taxonomy are all copied from that
> precedent.

---

## The four findings that reshaped the plan

**1. This repository contains four products, not two.** The brief's model is
"medical platform core + nutrition vertical". The code says otherwise. Measured:
Books is ~90 backend files plus ~4.2k frontend LOC (a bespoke Arabic digital
publishing system with immutable editions and a Puppeteer PDF renderer);
`campaigns` is ~30 files (a marketing landing-page builder); and `reviews`,
`videos`, `faq-*`, `packages`, `packages-page-settings`, `site-settings`,
`doctor-profile` are all public-website content management. **Collectively that
is more than half the route surface and the majority of the code, and none of it
would ship in a sellable medical platform.** The target architecture therefore
fences four pillars, not two. See [03](03-target-architecture.md) and
[23](23-site-cms-and-books-disposition.md).

**2. The rename is free, and it is free only now.** `grep -rn 'ClientProfile|Patient'`
across all of `nutrition-client` returns **0 matches**. No public route exposes
the client/patient entity; the single public write path
(`POST /api/public/consultation-requests`) always answers `{success: true}` and
maps to the entity entirely server-side. The whole cross-repo contract is exactly
four things — the 18 `/api/public/**` paths, 12 `domain/*.ts` response shapes in
nutrition-client, the `CacheTag` string vocabulary, and the
`ConsultationRequestIntent` enum. Freeze those and `Client → Patient` is a
nutrition-staff-internal change. See [04](04-domain-model.md), [20](20-migration-strategy.md).

**3. The toolkit is in much better shape than the brief assumes — and worse in
exactly two places.** Granular permission primitives, a permission-check
function, a focus-trapped RTL-correct **drawer**, KPI/stat cards, a generic
timeline, DST-correct timezone math, and soft delete all already exist and are
under-used (`drawerPresentation` is used **zero** times by this app; the app
imports the 93 kB root barrel in 147 files while the package ships 16 granular
entries specifically to avoid that). The two real holes are **any calendar or
scheduling UI** and **resource-scoped authorization** — plus money, audit,
notifications, command palette, and `raw`/document asset upload with private
delivery. See [19](19-toolkit-and-package-changes.md).

**4. Transactions are plumbed everywhere and started nowhere — and a
transaction alone would not have been enough.**
`session?: mongoose.ClientSession` is threaded through _every_ read and write
path of `MongooseRepository`. But `startSession` appears in **zero** source files
across all seven packages and all of `nutrition-staff` — only in the toolkit's own
tests. Meanwhile six multi-collection write paths in the app do manual
`catch`-and-rollback, and `create-client.ts:19` says so out loud: _"Not a real
database transaction (this app has none … no precedent for Mongoose sessions
anywhere in this codebase)."_ For clinical and billing records that is a
correctness defect, not a nicety. Transactions are therefore a Phase 0
infrastructure workstream with its own document:
[05](05-transactions-and-data-integrity.md).

Several things the first drafts got wrong, all corrected and all worth stating
because they are the kind of error that survives review by sounding right. **Snapshot isolation is not serializability:** an overlap check inside a
transaction does _not_ stop two concurrent bookings inserting two different
appointment documents, because there is no shared write to conflict on — so
scheduling needs an explicit serialization point
([10](10-appointments-scheduling.md)). And **a transaction wrapper cannot observe
an exception it never sees:** detecting a swallowed error only when it passes
through a nested `withTransaction` frame leaves the common case wide open, so
rollback-only needs to be markable at the repository layer and explicitly by the
caller ([05](05-transactions-and-data-integrity.md)).

The adversarial review then found four more of the same kind, each verified
against the real code before being accepted: the booking design called a
repository `upsert` **that does not exist**; **populate is entirely unscoped**, so
the tenancy design had a cross-organization read path straight through it;
`syncPermissions` runs at **every server boot**, so the planned permission
deactivation would have fired destructively during a rolling deploy; and the
`Client → Patient` cutover could not survive a rolling deploy at all. All four
are fixed. [25](25-risks-and-open-decisions.md) §The Codex review has the full
account.

---

## Documents

| Doc                                                                                | Workstream                                                                                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [01-product-scope.md](01-product-scope.md)                                         | First-release scope, non-goals, what "sellable" means here                                |
| [02-audit-findings.md](02-audit-findings.md)                                       | Verified current state: entities, routes, conventions, landmines                          |
| [03-target-architecture.md](03-target-architecture.md)                             | The four-pillar `src/` structure and the import-boundary rules                            |
| [04-domain-model.md](04-domain-model.md)                                           | Every target entity, field, relationship, and state machine                               |
| [05-transactions-and-data-integrity.md](05-transactions-and-data-integrity.md)     | **Transaction abstraction, session context, rollback.** Gates every multi-write workflow. |
| [06-organization-and-branches.md](06-organization-and-branches.md)                 | Organization/Branch/Room, org resolution, the path to SaaS tenancy                        |
| [07-authorization-roles-permissions.md](07-authorization-roles-permissions.md)     | Clinical role vocabulary, resource-scoped auth, the permission migration                  |
| [08-platform-foundation.md](08-platform-foundation.md)                             | Settings, documents/files, notifications, global search, audit trail                      |
| [09-patients.md](09-patients.md)                                                   | Patient identity, MRN, alerts, contacts, unified timeline                                 |
| [10-appointments-scheduling.md](10-appointments-scheduling.md)                     | Calendar, availability, booking lifecycle, check-in, waiting board                        |
| [11-encounters-clinical-records.md](11-encounters-clinical-records.md)             | Encounter model, vitals, diagnosis, prescriptions, attachments                            |
| [12-vertical-extension-model.md](12-vertical-extension-model.md)                   | How a specialty extends the clinical core without entering it                             |
| [13-nutrition-vertical.md](13-nutrition-vertical.md)                               | Nutrition extracted intact: assessments, anthropometry, the calc engine                   |
| [14-crm-and-followup.md](14-crm-and-followup.md)                                   | Follow-ups, tasks, contact attempts, missed-appointment recovery                          |
| [15-billing-and-payments.md](15-billing-and-payments.md)                           | Service catalog, invoices, payments, discounts, balances                                  |
| [16-dashboard-and-reporting.md](16-dashboard-and-reporting.md)                     | Role-relevant dashboards and the aggregation problem behind them                          |
| [17-ux-architecture-and-design-system.md](17-ux-architecture-and-design-system.md) | Workspace shell, role homes, patient context, tokens, typography                          |
| [18-motion-system.md](18-motion-system.md)                                         | Layered motion contract for operational medical software                                  |
| [19-toolkit-and-package-changes.md](19-toolkit-and-package-changes.md)             | Per-package changes and the release waves that gate app work                              |
| [20-migration-strategy.md](20-migration-strategy.md)                               | The `Client → Patient` rename and the `organizationId` backfill                           |
| [21-migrations-and-seeding.md](21-migrations-and-seeding.md)                       | The migration framework itself, plus demo/seed data                                       |
| [22-testing-and-qa.md](22-testing-and-qa.md)                                       | Backend test project, coverage targets, browser QA bar                                    |
| [23-site-cms-and-books-disposition.md](23-site-cms-and-books-disposition.md)       | What happens to the Dr. Omnia website CMS and to Books                                    |
| [24-future-expansion.md](24-future-expansion.md)                                   | Deferred hospital modules and the hooks left for them                                     |
| [25-risks-and-open-decisions.md](25-risks-and-open-decisions.md)                   | Open questions, alternatives considered, rejected options                                 |

## Conventions used in every workstream doc

Purpose · Current state · Target state · Scope · Explicitly out of scope ·
Domain concepts · Relationships · State transitions · Roles & permissions ·
Workflows · Screens/routes · APIs · Validation & business rules ·
Search/filter/sort · Files & media · Notifications & events · Audit ·
Toolkit dependencies (local vs shared) · Migrations · Backward compatibility ·
Edge cases · Error states · Accessibility · Responsive · Motion ·
Testing strategy · Acceptance criteria · Prerequisites · Downstream
dependencies · Implementation steps · Codex findings and resolution.

Not every doc carries every heading — a doc omits a heading when it genuinely
does not apply, and says so rather than leaving an empty section.

---

## Architecture summary

Four pillars inside one repository, one direction of dependency:

```
                    ┌──────────────────────────────┐
                    │  core/   (infra, no domain)  │
                    │  routes · auth · db · assets │
                    │  session/tx · audit · org ctx│
                    └──────────────┬───────────────┘
                                   │  (everything may import core)
                 ┌─────────────────┴──────────────────┐
                 │                                    │
      ┌──────────▼──────────┐              ┌──────────▼──────────┐
      │     platform/       │              │       books/        │
      │  the sellable core  │              │ separate product,   │
      │  org · patients ·   │              │ preserved as-is     │
      │  appointments ·     │              └─────────────────────┘
      │  encounters · crm · │
      │  billing · staff ·  │              ┌─────────────────────┐
      │  reporting · files  │              │     site-cms/       │
      └──────────┬──────────┘              │ Dr. Omnia website   │
                 │                         │ content, deployment-│
      ┌──────────▼──────────┐              │ specific, not sold  │
      │ verticals/nutrition/│              └─────────────────────┘
      │ assessments ·       │
      │ anthropometry ·     │   platform ──► core           only
      │ calc engine · plans │   verticals ──► platform, core
      └─────────────────────┘   site-cms ──► core  (+ platform for patients)
                                books    ──► core  (+ site-cms for RECIPE_REF)
```

- **`platform/` never imports `verticals/`, `site-cms/`, or `books/`.** That one
  rule is what makes a later product-repo extraction a move rather than a
  rewrite, and it is enforced mechanically — see [03](03-target-architecture.md).
- Nutrition keeps every capability it has today. Nothing is deleted to make
  something generic.
- One `Organization` row per deployment now; `organizationId` on every schema
  from day one so row-level SaaS tenancy is later a resolver change, not a
  24-collection migration.

## Final first-release scope

In: organization & branches · users/staff/practitioners · roles & granular
permissions · audit trail · documents · notifications · global search ·
patients (MRN, alerts, contacts, timeline) · appointments & scheduling
(calendar, availability, check-in, waiting board, walk-ins, no-shows) ·
encounters (complaint, vitals, notes, diagnosis, basic prescription,
attachments, follow-up, specialty templates) · CRM follow-up (tasks, contact
attempts, recovery) · practical billing (services, invoices, payments,
discounts, balances) · role-based dashboards · the nutrition vertical, intact.

Out: full financial accounting · insurance claims · admissions/wards/beds ·
nursing · emergency department · laboratory · radiology · pharmacy ·
inventory/procurement · operating theatre · patient portal · online booking ·
multi-currency beyond a `Money` primitive · row-level SaaS tenancy. See
[24](24-future-expansion.md) for what is deliberately deferred and what hooks
exist for it.

---

## Implementation phases

Small and verifiable, in dependency order. Every phase ends at a checkpoint
with acceptance gates; no phase begins before its prerequisites are green.

| Phase  | Name                                                                                   | Gates on                           | Parallelizable within phase    |
| ------ | -------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------ |
| **0**  | Foundations & safety net                                                               | —                                  | ✅ six independent tracks      |
| **1**  | Toolkit release wave A (backend)                                                       | 0                                  | ✅ with 1F                     |
| **1F** | Toolkit release wave A (frontend)                                                      | 0                                  | ✅ with 1                      |
| **2**  | Design system, shell & motion foundation                                               | 1F                                 | ✅ tokens / shell / motion     |
| **3**  | Organization, branches, practitioners                                                  | 1                                  | ❌                             |
| **4**  | Authorization: roles, scoping, audit                                                   | 3                                  | ❌                             |
| **5**  | Patient (rename + medical identity)                                                    | 4                                  | ✅ backend / UX tracks         |
| **6**  | Appointments & scheduling                                                              | 5, 2, **+ the doc-10 review gate** | ✅ calendar bake-off / backend |
| **7**  | Encounters + vertical extension model                                                  | 6                                  | ❌                             |
| **8**  | Nutrition vertical extraction                                                          | 7                                  | ✅ per nutrition module        |
| **9**  | CRM & follow-up                                                                        | 5                                  | ✅ with 8                      |
| —      | **◆ COMMERCIAL CHECKPOINT** — a usable, sellable clinic-management product exists here | 0–7, 9                             | —                              |
| **10** | Billing & payments                                                                     | 5, 6                               | ✅ with 8/9                    |
| **11** | Dashboards & role workspaces                                                           | 6, 9, 10                           | ✅ per role                    |
| **12** | Toolkit release wave B + hardening                                                     | 11                                 | ✅                             |

### Dependency graph

```
Phase 0  Foundations
 ├── 0A test infrastructure + nutrition-engine tests
 ├── 0B migration framework
 ├── 0C transactions: withTransaction + rollback-only     ── doc 05
 ├── 0D clinical FK indexes + cache-tag drift fix
 ├── 0E minimal CI in all nine repos                      ── doc 22
 └── 0F HTTP idempotency keys + optimistic concurrency     ── docs 04, 22
        (retrofitting either after the mutating routes
         exist means touching all of them again)
        │
        ├──────────────► Phase 1  toolkit wave A (backend)  ── doc 19
        │                   └──► 3 ──► 4 ──► 5 ──┬──► 6 ──► 7 ──► 8
        │                                        ├──► 9
        │                                        └──► 10 (also needs 6)
        └──────────────► Phase 1F toolkit wave A (frontend)
                            └──► 2  design system + shell + motion
                                   └──► 6 (calendar), and every later UX slice

                        6 + 9 + 10 ──► 11 dashboards ──► 12 wave B + hardening
```

### The commercial checkpoint

The full roadmap stands — billing is **not** being removed from the first
release. But it is worth being explicit about where the product becomes sellable,
because that is different from where the roadmap ends:

> **After Phase 9 — foundations, toolkit waves, design system and shell,
> organization and branches, authorization, patients, scheduling, encounters and
> core CRM — a clinic can run its entire day on this product.** Book, check in,
> see patients, record and sign encounters, prescribe, follow up, and chase
> recalls. That is a usable, demonstrable, sellable clinic-management platform.

Phase 8 (nutrition vertical extraction) and Phase 10 (billing) continue after
that point, and both are planned to ship.

**If schedule pressure appears, billing is the cleanest cut line.** It is the
last feature phase with no downstream dependents other than reporting, its seams
are already defined ([15](15-billing-and-payments.md)), and a clinic that already
has its own invoicing loses least by waiting. Nutrition extraction is _not_ a
good cut line — it is what makes the platform sellable to a non-nutrition clinic
at all. This is a contingency, not a plan.

**What may run in parallel:** Phase 0's four tracks; the backend and frontend
toolkit waves; Phase 2's token / shell / motion tracks; Phases 8, 9 and 10 once
Phase 7 lands; per-role work inside Phase 11; and
[23](23-site-cms-and-books-disposition.md) at any time, since it touches nothing
the platform pillar owns.

**What must never run in parallel:** anything touching `EntityName`, the
permission registry, or the `Organization` resolver. Those are single-owner
changes — see the parallel-agent policy in the workspace `CLAUDE.md`.

### Two mandatory review gates

Closing this roadmap does not wait on review quota. Starting these two phases
does.

| Gate                                                                               | Blocks       | Why                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Second adversarial pass on the rewritten `ScheduleSlot` mechanism                  | **Phase 6**  | The most correctness-critical mechanism in the plan, rewritten after the first review found the original fatally flawed, and not yet attacked in its new form. Specific queued questions in [10](10-appointments-scheduling.md) — the `consumed` vs `appointmentIds` source-of-truth question above all. |
| Second adversarial pass on `withTransaction`'s `tx.complete()` and driver-wrapping | **Phase 0C** | Queued questions in [05](05-transactions-and-data-integrity.md).                                                                                                                                                                                                                                         |

The tenancy rewrite in [06](06-organization-and-branches.md) carries its own
queued questions and should be reviewed before Phase 3, but its controls do not
depend on a single mechanism the way the two above do.

### Toolkit releases required before app work

| Wave           | Packages, in dependency order                                                                                                                                                                        | Blocks         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **A-backend**  | `toolkit-common` → `backend-toolkit-core` → `backend-toolkit-mongoose` **0.4.0 (transactions)** → **0.5.0 (tenancy)** → **0.6.0 (the rest)** → `backend-toolkit-next` → `backend-toolkit-cloudinary` | Phases 3–5, 10 |
| **A-frontend** | `toolkit-common` (shared with above) → `frontend-toolkit-core` → `frontend-toolkit-tailwind`                                                                                                         | Phase 2        |
| **B**          | `frontend-toolkit-tailwind`, `backend-toolkit-mongoose` (saved views), and a calendar extraction **only if** the Phase 6 bake-off produces a proven interface                                        | Phase 11+      |

`backend-toolkit-mongoose` ships as three releases, each carrying one invariant,
because the original single release bundled transactions, tenancy, auditing,
indexing, aggregation, bulk writes and permission lifecycle — leaving no way to
attribute or roll back a regression. 0.5.0 does not ship until 0.4.0 is exercised
in the app.

**Phase 6 no longer waits on a toolkit calendar.** The scheduling UI is built
app-local after a library bake-off; extraction to a package is deferred to a real
second consumer. See [19](19-toolkit-and-package-changes.md) §The calendar
decision.

Each publish is a separate, explicitly-requested act. Verification before any
publish is `npm run build && npm pack` plus a tarball install in the real
consumer — never a symlink, never a `node_modules` swap.

### Migrations and refactors required before feature work

| #   | Change                                                                                                                                           | Phase | Reversible?    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | -------------- |
| M1  | Migration framework + history collection                                                                                                         | 0B    | n/a            |
| M2  | Indexes on every clinical FK                                                                                                                     | 0D    | ✅             |
| M3  | `User` gains soft delete                                                                                                                         | 3     | ✅             |
| M4  | `User.phone` sparse-unique → non-unique + `Patient`-scoped identity                                                                              | 3     | ⚠️ index drop  |
| M5  | `Organization` + `Branch` created; `organizationId` backfilled everywhere                                                                        | 3     | ✅ additive    |
| M6  | 4 settings singletons → org-scoped settings                                                                                                      | 3     | ⚠️             |
| M7  | Permission registry expands (custom actions); `Role.permissions` remap                                                                           | 4     | ⚠️             |
| M8  | `ClientProfile` → `Patient`: collection rename, permission re-seed, role remap, MRN backfill, allergy promotion as _unverified imported history_ | 5     | ❌ **one-way** |
| M9  | `ClientMeasurement` splits into platform `Observation` + nutrition anthropometry                                                                 | 8     | ⚠️             |

M8 and M9 are the two that need a rehearsal on a restored dump before they touch
anything real. See [20](20-migration-strategy.md).

### Checkpoints and acceptance gates

Every phase must satisfy all of these before the next begins:

1. `npx tsc --noEmit` clean in every repository touched.
2. `npm test` green, with the phase's new tests actually asserting the phase's
   invariants (not smoke tests).
3. For any multi-collection write introduced: a commit test **and** a rollback
   test, per [05](05-transactions-and-data-integrity.md).
   3a. For any uniqueness or non-overlap invariant introduced: a concurrency test
   proving two competing writes cannot both commit, **plus a negative control**
   that fails when the serialization is removed.
   3b. Route inventory byte-identical to the committed manifest, **plus** Next's
   build-manifest diff and contract tests over the four hand-rolled binary
   handlers — no phase may change an existing API URL or its behaviour
   ([03](03-target-architecture.md)).
   3c. For any mutating route introduced: an idempotency-replay test and, where the
   entity is concurrently editable, a stale-revision 409 test.
4. For any UI introduced: measured DOM geometry at 375 / 768 / 1440 — no
   horizontal page overflow, computed contrast ≥ 4.5:1 for text and ≥ 3:1 for UI,
   reduced-motion honoured, first-render stable. Screenshots are evidence, never
   proof; measure the DOM.
5. For any shared-package change: built, packed, and exercised in a real
   consumer against the tarball.
6. For any migration: dry-run output reviewed, rehearsed against a restored
   dump, and idempotent on a second run.
7. `nutrition-client` still builds and its 18 public endpoints still answer with
   unchanged shapes. This is checked every phase, not once.
8. An independent Codex review of the phase's design before implementation and
   of its diff before the checkpoint closes.
9. CI green (from Phase 0E onward).

### Status tracking

Each doc carries its own `**Status:**` line under its H1. This table is the
programme roll-up and is the single place to look for "where are we".

| Doc   | Status                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------- |
| 01–25 | **Approved 2026-08-22** — planning complete, internally consistent, approved for implementation |

Fifteen of the twenty-five (03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 19, 20, 22,
24, 25) were revised after the adversarial review before approval.

Every revised document carries its own _Codex findings and resolution_ table with
severity, analysis, and the accept/reject decision per finding.

**One review gap, recorded rather than glossed:** the six rewritten designs
answer the first review's findings but have not themselves been independently
attacked — the Codex usage limit was reached immediately after the first pass
(resets 2026-08-25). This does **not** block closing the roadmap; it blocks
starting Phases 0C and 6, per the gate table above. Docs
[05](05-transactions-and-data-integrity.md),
[06](06-organization-and-branches.md) and
[10](10-appointments-scheduling.md) carry the specific queued questions. The
booking mechanism most needs it, and one weakness is already visible on
re-reading: a `consumed` counter that can drift from the `appointmentIds` array
beside it, where the array is arguably the better source of truth.

### Settled architectural decisions — one answer each

| Decision                     | Final answer                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tenancy                      | One `Organization` per deployment; `organizationId` on every schema; `User` **is** organization-bound; no `OrganizationMembership` in v1 |
| Repo strategy                | Evolve in place, four fenced pillars, extraction deferred with published triggers                                                        |
| Patient entity               | `ClientProfile` → `Patient`, via a four-release expand/contract rollout                                                                  |
| Booking serialization        | Pre-materialized fixed-bucket `ScheduleSlot` claims with capacity                                                                        |
| `SLOT_MINUTES`               | Organization setting with a documented change/re-materialization rule                                                                    |
| Transactions                 | `withTransaction` wrapping the driver helper; ambient session; **four** rollback-only layers incl. `tx.complete()`                       |
| Exhausted transient retries  | 503, never 409                                                                                                                           |
| Scope enforcement            | Separate scoped/global repository factories; no opt-out; populate scoped at every depth                                                  |
| Resource authorization       | Post-validation guard as defence-in-depth; ownership **in the query filter**                                                             |
| Permission deactivation      | An explicit migration step; `syncPermissions` stays insert-only forever                                                                  |
| Document delivery            | Both provider grants and proxy streaming, configurable; sensitive kinds default to proxy                                                 |
| `DocumentAsset`              | Opaque locator plus metadata; **no stored delivery URL**                                                                                 |
| Calendar                     | Library bake-off, then app-local; no calendar in a shared package                                                                        |
| Money                        | `bigint` + ISO 4217 exponents in `toolkit-common`; formatting and parsing outside it                                                     |
| Indexes                      | `@Index()` only; no `@Filterable` auto-indexing                                                                                          |
| Encounter sections           | `Mixed` payload with a mandatory `schemaVersion` and a schema-level validator                                                            |
| Clinical status on migration | Every migrated patient `ACTIVE`; nothing inferred from `crmLifecycle`                                                                    |
| Imported allergy history     | Immutable staging collection, clinician-promoted, visible on the banner                                                                  |
| CI                           | Minimal, Phase 0E, never publishes                                                                                                       |
| Commercial checkpoint        | After Phase 9; billing is the cut line if pressure appears                                                                               |

Status vocabulary, inherited from the workspace precedent:
**Approved** · **Complete** · **In progress** · **Planning complete, awaiting approval** ·
**Superseded** (with a pointer to what replaced it) · **Intentionally open**
(a decision deliberately deferred, with the trigger that reopens it) ·
**Outside this programme**.

### Future modules deliberately deferred

Admissions · wards & beds · nursing workflows · emergency department ·
laboratory (orders, specimens, results) · radiology (orders, PACS/DICOM) ·
pharmacy (dispensing, stock) · inventory & procurement · operating theatre ·
insurance & claims · accounting integrations · patient portal · online booking ·
telemedicine · SMS/WhatsApp campaign automation.

None of these are built. Several are made _cheaper_ by decisions taken now —
`organizationId` and `branchId` on every record, an append-only `AuditEvent`
stream, a `Document` entity with private delivery, an `Encounter` that is not an
`Appointment`, and an order-shaped `Service`/`Invoice` split. The full list of
"decide now, build later" hooks is in [24](24-future-expansion.md).
