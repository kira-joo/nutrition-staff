# 25 — Risks and open decisions

**Status: APPROVED 2026-08-22.**

## Purpose

The things most likely to go wrong, the decisions still genuinely open, and the
alternatives that were considered and rejected — recorded so they are not
silently reopened or silently reintroduced.

## The Codex review, and what it changed

An adversarial review was run against the revised plan on 2026-08-22 (read-only,
from the workspace root, with access to the real package source). It was asked to
attack ten specific designs and to find what was wrong rather than validate.

Its verdicts on the ten areas: **FATALLY FLAWED** on appointment serialization,
organization scope injection, `Encounter.sections`, the `Client → Patient`
migration, the custom calendar, and toolkit over-generalization; **FLAWED** on
transaction rollback-only semantics, historical allergy promotion, and Cloudinary
document delivery; **SOUND** on the API route strategy.

Three of its critical claims were verified directly against the code before being
accepted, and all three held:

| Claim | Verified |
|---|---|
| The repository has no `upsert`, so the booking pseudocode called an API that does not exist | `create-mongoose-repository.ts:278` → `write/execute-update.ts:36` — a plain `findOneAndUpdate`, no upsert option |
| Populate is completely unscoped | `execute-find-query.ts:28` passes each node to `query.populate(node)`; `PopulateNode` has no `match` field |
| `syncPermissions` runs at every server boot, so a deactivation pass would fire destructively during a rolling deploy | `src/instrumentation.ts:33`, inside `register()` |

**What changed as a result** — six designs were rewritten, not patched:

1. **Booking serialization** — the per-day version-document design is gone,
   replaced by pre-materialized fixed-bucket `ScheduleSlot` claims with capacity.
   The original raced on first-use upsert (`E11000`, not retryable inside a
   transaction from MongoDB 8.1) and serialized every booking for a busy
   practitioner-day into false 409s.
2. **Tenancy** — the caller-accessible `skipOrganizationScope` opt-out is gone,
   replaced by separate scoped and global repository types; populate is scoped at
   every depth; `organizationId` is stamped from context and immutable; every
   unique index becomes compound.
3. **Transactions** — a fourth layer (`tx.complete()`), full retry semantics
   including per-attempt hook lifecycle, a session-identity guard, a ban on
   parallel work inside a transaction, 503 instead of 409 on exhausted retries,
   and the driver's own transaction helper instead of a hand-rolled retry loop.
4. **`Client → Patient`** — a four-release expand/contract rollout instead of a
   single cutover, because the original could not survive a rolling deploy.
5. **Allergy promotion** — an immutable staging collection, all assessments
   rather than only the latest, unverified history **on** the banner rather than
   hidden behind a chip, and only exact sentinels auto-skipped.
6. **The calendar** — reversed. No calendar ships in a shared package; a library
   bake-off precedes an app-local implementation. The "no candidate handles RTL"
   justification was simply false.

Plus: roughly a third of the proposed toolkit surface was cut as
over-generalized, and `backend-toolkit-mongoose`'s wave-A release was split into
three so a regression is attributable.

**Where I pushed back.** One finding was accepted only in part: the suggestion to
abandon the vertical registry in favour of typed collections and routes per
specialty. The drift and versioning critiques behind it were accepted in full
(hence `schemaVersion`), but collapsing the mechanism would defeat the product
requirement that makes this sellable outside nutrition. The compromise is that
the highest-value nutrition data — `NutritionAssessment` — stays a typed
collection rather than a section payload, so `Mixed` carries only the long tail.
See [12](12-vertical-extension-model.md).

Each affected document carries its own findings table with severity, my analysis,
and the accept/reject decision.

## Top risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **M8 (`Client → Patient`) is one-way.** Collection rename, permission re-seed, role remap, MRN backfill, lifecycle split, and an allergy promotion, all at once. | High | Mandatory rehearsal against a restored dump with a reviewed diff; permissions deactivated rather than deleted so no `Role.permissions` reference dangles; source collection archived rather than dropped; a full dump immediately before. [20](20-migration-strategy.md) |
| R2 | **The allergy promotion is a clinical-safety migration.** Free text, negations, duplicates, and severity that was never recorded. | High | Nothing is written into `PatientAlert` by the migration at all. Every non-negated entry from **every** assessment (not only the latest — an omission is not a negation) is imported into the immutable **`ImportedClinicalHistoryCandidate`** staging collection at `severity: UNKNOWN`, carrying its source assessment, field and date. Only **exact** sentinels auto-skip, so `"no allergy except penicillin"` reaches review rather than being discarded. No destructive de-duplication — near-duplicates are grouped visually, originals preserved. Candidates are surfaced **on the patient banner** in a distinct high-salience state, so the banner can never imply "no allergies" while any are unreviewed. A clinician promotes a candidate to a real `PatientAlert` with a real severity, or dismisses it with a reason; both are audited. The dry-run report is reviewed by a clinician before the migration is applied, and it does not run unattended. |
| R3 | **Transactions require a replica set.** Local dev on a standalone `mongod` will fail the moment a transaction runs, and production on a single self-managed `mongod` would too. | High | `withTransaction` throws `ConfigurationError` naming the requirement rather than falling through to a non-transactional write; documented in the README; a single-node replica set is a Phase 0 deliverable. [05](05-transactions-and-data-integrity.md) |
| R4 | **Documents on permanent public CDN URLs** — an access-control flaw that blocks the clinical-document feature. | High | Private/signed delivery in `backend-toolkit-cloudinary` 0.2.0, in release wave A. No document feature ships before it. This fixes confidentiality of the delivery path; it is **not** a compliance claim, and provider suitability stays a per-deployment decision — see D1. |
| R5 | **Step 6.5 changes the route factory's documented fixed 9-step sequence**, which every route in both applications depends on. | High | The most heavily tested item in the wave: assert 401 → 403 → 400 → scope → handler ordering, and that a route without `scope` behaves byte-identically. Codex review before implementation. [19](19-toolkit-and-package-changes.md) |
| R6 | **The pillar move is ~500 files in one commit**, in a workspace where three repos have unpushed `staging` commits and multiple sessions share the trees. | Medium-high | Push everything first; do the move alone in one sitting with nothing else landing; verify by an identical route inventory before and after. [03](03-target-architecture.md) |
| R7 | ~~**No CI anywhere.**~~ **Resolved.** Minimal CI is approved and is Phase 0 track 0E. | — | Specified in [22](22-testing-and-qa.md) §CI. Publishing stays manual and explicitly approved; CI never publishes. |
| R7a | **Concurrent overlapping bookings were not actually serialized** — snapshot isolation does not prevent two inserts of distinct documents from both committing. A first fix (a per-practitioner-per-day version document) was itself flawed: it required a repository `upsert` that does not exist, raced on first use with a non-retryable `E11000`, and serialized every booking for a busy practitioner-day into false 409s. | Was high, now designed — **second review still pending** | Pre-materialized fixed-bucket `ScheduleSlot` claims with `capacity`/`consumed`, conditional atomic `$inc`, materialization outside booking transactions. 14 concurrency tests including a negative control. [10](10-appointments-scheduling.md) |
| R7b | **A swallowed error inside a transaction could silently commit partial work** — the original "poisoning" design only caught errors passing through a nested `withTransaction` frame. | Was high, now designed | **Four** layers: repository writes auto-mark rollback-only, nested frames mark, explicit `tx.markRollbackOnly(cause)`, and **`tx.complete(value)`** required for write transactions so an early return or forgotten acknowledgement aborts. The residual gap (a deliberate `catch {}` plus a deliberate `tx.complete()`) is documented rather than papered over, and a QA check flags swallow-without-mark. [05](05-transactions-and-data-integrity.md) |
| R8 | **Scope creep from 24 to ~50 collections.** Twelve phases is a long programme, and the brief warns against building a hospital ERP first. | Medium | Every phase is independently shippable and ends at a checkpoint. Billing is the most deferrable slice with a clean seam. |
| R9 | **`toolkit-common` is used in 33 `nutrition-client` files.** A mistake there breaks the public website. | Medium | Tarball verification against **both** consumers before publish. `nutrition-client` needs no bump for these additions. |
| R10 | **In-memory aggregation will not survive the seeded scale dataset**, and the dashboard is currently built on it entirely. | Medium | Aggregation support is a wave-A prerequisite for Phase 11; the sub-500 ms target is measured against tier-3 seed data, not asserted. |
| R11 | **Implicit organization scoping can hide a tenant leak** more effectively than explicit filtering would. | Medium | Two layers: automatic injection *and* a required indexed field so an unscoped write fails at the schema. Cross-org isolation tests on every list endpoint, written while there is still one org. Codex specifically asked to challenge this. [06](06-organization-and-branches.md) |
| R12 | **`Encounter.sections` is `Mixed`**, and the audit flagged unvalidated `Mixed` as a real existing defect. | Medium | Exactly one write path, always through the registered DTO, plus a per-section size cap. But it is the same shape as the defect, and it is flagged for Codex. [12](12-vertical-extension-model.md) |
| R13 | ~~**`CalendarView` is a large surface to own.**~~ | **Resolved by reversing the decision** | No calendar ships in a shared package. A Phase 6 bake-off (FullCalendar/Scheduler, Schedule-X, React Big Calendar + resource view, DayPilot Lite) against Arabic/RTL, DST, 6+ lanes, 375px and screen-reader fixtures precedes an app-local implementation; extraction waits for a second consumer. The original "no candidate handles RTL" justification was false. [19](19-toolkit-and-package-changes.md) |
| R14 | **Retaining `ClientMeasurement` read-only for one release means two sources of truth for a release.** | Medium | Accepted deliberately as the cheaper risk than an unverifiable one-way split. Flagged for Codex. |
| R15 | **`POST /api/auth/signup` is `auth: false`** and mints identities in the shared `users` collection. | Low now, high with tenancy | Inert today (a fresh signup has zero permissions). Must become invite-only before SaaS tenancy. The route's own comment says it "only requires editing this one handler." |
| R16 | **The `CacheTag` vocabulary is hand-duplicated across two repos and has already drifted** (`video(id)` exists in the client, not in staff). | Low | Fixed in Phase 0D and guarded by a parity check modelled on the proven `check-mark-renderer-parity.ts`. Per-tenant namespacing is the real cost, and it lands with tenancy. |
| R17 | **Motion is a new dependency for one or two genuine cases.** | Low | Most of the motion contract is CSS. Codex is asked whether the shared-layout board card justifies the bundle at all. [18](18-motion-system.md) |

## Open decisions

Genuinely open — each needs an answer, and each changes work rather than being a
matter of taste.

**D10 — Proxy streaming or provider grants for patient documents? — DECIDED:
both, configurable.**
The asset abstraction supports **both** proxy-streaming through the application
and short-lived provider download grants. Neither is forced globally: proxy
streaming for every document has real bandwidth and deployment cost that has not
been measured, and forcing it unmeasured would be a guess dressed as a security
decision. **The most sensitive document `kind`s default to proxy streaming where
operationally viable**; everything else uses a grant. The choice is a
deployment- and provider-level configuration, not a hardcoded domain rule. See
[08](08-platform-foundation.md).

**D11 — `SLOT_MINUTES` default? — DECIDED: it stays an organization setting, and
the change rule matters more than the default.**
`SLOT_MINUTES` is configuration, never a domain constant. Whether the initial
default is 5 or 10 is not the interesting question; what matters is the documented
behaviour when it changes while materialized slots and live bookings already
exist. That rule is specified in [10](10-appointments-scheduling.md). Every
`AppointmentType` duration must be a multiple of the current value, validated at
type creation.

**D1 — Is Cloudinary an acceptable store for patient documents?**
Signed private delivery closes the access-control flaw, and that part is settled.
What is not settled is provider suitability, which is deployment- and
jurisdiction-dependent: data residency, the contractual/DPA position and
subprocessors, retention and deletion including from backups, provider-side
access logging, backup and restore access, encryption at rest and key custody,
and the customer's regulatory regime.

**No wording anywhere in this plan should imply "signed Cloudinary URLs = PHI
compliance."** It does not.

**Recommendation:** implement signed private delivery as the v1 mechanism; treat
provider selection as a per-customer procurement question answered before that
customer stores real patient documents; and keep the `AssetProvider` abstraction
in `backend-toolkit-core` clean enough that substituting region-specific object
storage is a provider implementation rather than a refactor. The interface
already forbids direct-to-provider upload — every byte passes through the
application server — which is what makes substitution realistic.

**D2 — Add CI? — DECIDED: yes.**
Approved. Minimal CI becomes Phase 0 track 0E, specified in
[22](22-testing-and-qa.md) §CI: `tsc --noEmit`, tests, build, the four QA
checks, migration idempotency tests, and `npm pack` + smoke install for the five
toolkit repos. Deliberately not a DevOps programme — no deployment automation, no
environments, and **CI never publishes a package**; publishing stays manual and
per-instance approved. Roughly one day across all nine repos.

**D3 — Is billing in the first release? — DECIDED: yes, and the roadmap is not
shrunk.**
Billing stays in the first-release roadmap. What is now explicit instead is a
**commercial checkpoint** after Phase 9: foundation + organization/auth +
patients + scheduling + encounters + core CRM already constitute a usable,
sellable clinic-management product. Nutrition extraction (Phase 8) and billing
(Phase 10) continue after it. Billing remains the cleanest cut line **if**
schedule pressure appears — because it is the last feature phase with no
downstream dependents other than reporting. See the README's phase table.

**D4 — Does a second vertical get built as proof?**
[12](12-vertical-extension-model.md) proves the model with a fixture vertical in
a test file rather than a shipped specialty. **Recommendation:** the fixture is
sufficient proof of the *mechanism*; a real second specialty should wait for a
real second customer, because guessing at dentistry's needs is how the extension
model gets shaped wrong.

**D5 — Auto-index every `@Filterable()` field? — DECIDED: no, and the opt-in
flag was dropped too.**
L7 makes the temptation strong: no clinical foreign key is indexed today and
every patient-timeline read is a collection scan. An earlier draft proposed an
opt-in `@MongoSchema({autoIndexFilterable: true})`. **That was still the wrong
abstraction** — "filterable" is an API capability, indexing is a workload
property, and a single-field index on a low-cardinality enum usually loses to a
compound index over `(organizationId, status, date)` matching the real sort;
`@Relation` likewise does not imply a useful standalone index. **Only `@Index()`
ships**, and [04](04-domain-model.md)'s index plan declares every index
explicitly — which is the correct fix for L7 regardless.

**D6 — How aggressively is read-auditing applied?**
Auditing every clinical read answers "who opened this chart", which is the
question a clinic gets asked — and produces high volume.
**Recommendation:** audit every document download, every cross-scope access, and
every encounter-body read; do not audit list-page reads. Revisit against real
volume.

**D7 — Denormalise `Patient.outstandingBalance`, or compute on read?**
Denormalised is what the banner and the worklists need without four extra
queries, and it is maintained transactionally. It is also a consistency risk.
**Recommendation:** denormalise, with a property test asserting it equals
invoices minus payments, plus a periodic reconciliation check.

**D9 — Is `User` organization-bound? — DECIDED: yes, org-bound in v1. No
`OrganizationMembership`.**

`User` carries `organizationId` like every other entity. A global identity with
an explicit `OrganizationMembership` join is **not** added now.

The reasoning, which is stronger than the recommendation it overrides: the actual
deployment model is **one customer = one deployment + one database + one
`Organization`**. Inside a single isolated database there is no second
organization for a membership row to point at, so `OrganizationMembership` would
be a join table with exactly one row per user, forever — an abstraction carrying
no information.

And it would not even solve the problem it was proposed for. If the product later
moves to a genuinely shared SaaS model, the practitioners and patients who need
consolidating are spread across **separate databases**. Merging them requires an
explicit identity-federation and migration design — deduplicating humans across
deployments, reconciling credentials, resolving conflicting MRNs — none of which a
global `User` inside today's isolated database makes any easier. The hard problem
is cross-deployment, and a v1 abstraction cannot pre-solve it.

So: **recorded as a future SaaS design option, not a v1 abstraction.** When
shared-tenancy is genuinely on the table, global identity plus memberships is the
shape to reach for, and it arrives with the federation design it depends on. Noted
in [24](24-future-expansion.md).

This unblocks Phase 3.

**D8 — Should `NutritionAssessment` remain its own collection?**
It becomes an encounter section, but the `previousAssessmentId` chain and the
"compare to previous" affordance depend on the collection.
**Recommendation:** retain the collection. Flagged for Codex in
[13](13-nutrition-vertical.md).

## Rejected options, and why

Recorded so they are not silently reintroduced.

1. **Overlap-query-in-a-transaction as the double-booking guard.** Does not
   serialize concurrent inserts of distinct documents. Corrected in
   [10](10-appointments-scheduling.md); recorded here so it cannot return.
1a. **A per-practitioner-per-day occupancy/version document** as the fix for the
   above. Required a repository `upsert` that does not exist, raced on first use
   with an `E11000` that MongoDB 8.1+ does not retry inside a transaction, and
   serialized every booking for a busy practitioner-day into false 409s under
   burst. Replaced by pre-materialized fixed-bucket slot claims.
2. **Nested-frame-only transaction poisoning.** Cannot observe a swallowed error
   that never passes through a nested `withTransaction`. Corrected in
   [05](05-transactions-and-data-integrity.md).
3. **Deriving `clinicalStatus` from `crmLifecycle`.** Contradicted the entire
   purpose of separating them. Corrected in [20](20-migration-strategy.md).
4. **Moving `src/app/api/**` to mirror the pillars.** Under the App Router the
   path is the URL, so it would have broken every caller. Corrected in
   [03](03-target-architecture.md); the route tree stays put.
5. **Promoting imported allergies into ordinary `PatientAlert` rows with a
   guessed severity.** An unverified flag on something that otherwise looks
   identical to a confirmed alert will be read as clinical fact. Corrected in
   [20](20-migration-strategy.md) with an explicit provenance state.
6. **Four speculative hook fields** (`ResourceType.BED`, `Invoice.payerId`,
   `PrescriptionItem.drugId`, `Document.isPatientVisible`). Removed —
   [24](24-future-expansion.md).
7. **A new `medical-platform` repository now.** No second customer; doubles the
   surface during every feature phase; the boundary rule makes it cheap later.
   Trigger criteria published in [23](23-site-cms-and-books-disposition.md).
8. **Full row-level SaaS tenancy now.** Materially larger Phases 0–2 for a
   capability with no current customer. The `organizationId`-everywhere decision
   captures nearly all of the future value at a fraction of the cost.
9. **DB-per-tenant with no `Organization` entity.** Cheapest today and the trap:
   branches, rooms and per-clinic settings still need modelling, and adding
   `organizationId` later means migrating 50 collections.
10. ~~**A third-party calendar library.**~~ **This rejection was itself rejected
   on review and is reversed.** The stated reason — "none handles RTL or the
   `--ftk-*` token contract" — was factually wrong: FullCalendar, React Big
   Calendar, DayPilot, Mobiscroll and Schedule-X all support RTL, and CSS
   variables theme a third-party component through a wrapper perfectly well.
   What *is* rejected is **shipping a calendar in a shared package**: a Phase 6
   bake-off selects a library (or proves none fits), the scheduling UI is built
   app-local either way, and toolkit extraction waits for a real second consumer.
   See [19](19-toolkit-and-package-changes.md).
11. **A separate `FollowUp` entity.** `Patient.nextFollowUpAt` +
   `Encounter.followUpAt` + `Task` cover every case in the brief. A fourth
   overlapping concept is the speculative structure the brief forbids.
12. **A wide per-visit `Measurement` document.** Cannot represent a nurse taking
   blood pressure with no nutrition visit, forces a schema change per specialty,
   and makes "chart one value over time" a projection over sparse columns.
13. **Renaming `DoctorProfile → Practitioner`.** Costs a permission migration and
   a cross-repo cache-tag change for zero benefit — the marketing page still
   needs to exist. `Practitioner` is a new entity instead.
14. **Decoupling `EntityName` into four registries.** A large refactor whose only
   benefit is making future renames cheaper, and after M8 there are none planned.
15. **A `transaction: true` route-factory option.** Would wrap reads in
   transactions and put cache revalidation inside the transaction boundary.
   Transaction boundaries belong to the domain operation.
16. **`CacheTag` strings or `CACHE_POLICY` intervals in `toolkit-common`.**
    Proposed twice, rejected twice. Not re-proposed here, and it should not be
    without a materially new argument.
17. **A `@kira-joo/backend-toolkit-transactions` package.** Would need `mongoose`
    as a peer, would have one consumer, and would split the session contract
    across a package boundary. It belongs in `backend-toolkit-mongoose`.
18. **A fifth `shared-content` pillar to hold recipes.** More structure than the
    problem deserves; the `books → nutrition/patient-education` edge is recorded
    as the one wart instead.
19. **Generalising Books away from one doctor.** Work in service of a
    hypothetical.
20. **A visual template designer for encounter templates.** Ordinary CRUD screens
    in v1.
21. **A caller-controlled `skipOrganizationScope` opt-out.** A boolean on the
    ordinary repository API is not a tenant boundary. Replaced by separate
    scoped and global repository factories.
22. **`RouteAuthOption.scope` as the answer to resource authorization.** It is a
    preflight check with a TOCTOU gap, not authorization. Demoted to
    defence-in-depth; ownership must live in the query filter.
23. **An `AuditEvent` schema factory in a shared package.** Only the
    `AuditWriter` interface is generic; schema, redaction and retention stay
    app-local.
24. **Reporting aggregation builders in the repository factory.** They embed
    bucketing, timezone and status semantics — reporting concerns.
25. **`formatMoney` / `parseMoney` in `toolkit-common`.** Presentation and
    free-text parsing do not belong next to domain arithmetic.
26. **An opt-in `autoIndexFilterable` flag.** Filterability is an API property;
    indexing is a workload property. Only `@Index()` ships.
27. **Deactivation inside `syncPermissions`.** It runs at every server boot, so
    it would fire destructively during a rolling deploy. Deactivation is an
    explicit migration step.
28. **A global `User` with `OrganizationMembership` in v1.** One deployment means
    one organization, so the join table would carry no information — and it would
    not solve the cross-*deployment* identity problem it was proposed for. See D9.
29. **A global test-coverage percentage gate.** Would be satisfied by testing the
    40 interchangeable CRUD pages and would say nothing about the code that
    matters. Targeted 100% on the engine, money, intervals and state machines
    instead.

## Gaps the review found that the plan had missed entirely

Accepted and now placed. These are the most valuable output of the review,
because they are things no amount of re-reading the existing docs would have
surfaced.

| Gap | Placed in | Status |
|---|---|---|
| **HTTP-level idempotency.** Transaction retries do not protect against a *retransmitted request* — a double-clicked "Take payment" is two HTTP requests and two successful transactions. | `IdempotencyKey` entity ([04](04-domain-model.md)); applied to booking, check-in, sign, issue, payment, refund, registration; tested per route ([22](22-testing-and-qa.md)) | **In v1** |
| **Optimistic concurrency beyond encounters.** Patient demographics, alerts, invoices and appointments all need revision checks; two staff editing one record is normal. | `revision` + `expectedRevision` on every concurrently-editable entity ([04](04-domain-model.md), [11](11-encounters-clinical-records.md)) | **In v1** |
| **Backup restore rehearsal.** "Take a dump first" is not a recovery design if nobody has restored one. | A required test category ([22](22-testing-and-qa.md)); at least one full restore-and-migrate rehearsal per programme | **In v1** |
| **Field/projection-level authorization.** A role may see demographics but not clinical notes, billing or IDs; route-level and row-level do not cover it. | Entity-level omission plus per-role response shapes cover the concrete v1 cases ([07](07-authorization-roles-permissions.md)) | **Partial in v1**, general mechanism deferred |
| **Malware scanning and quarantine for uploaded documents.** Signed delivery stops the public reading a file; it does nothing about a malicious PDF reaching a receptionist. | Quarantine state + MIME sniffing + scan before `AVAILABLE` ([08](08-platform-foundation.md)) | **Moved into v1** |
| **Audit tamper resistance.** An ordinary mutable collection is not an adequate medical audit trail. | Append-only enforcement, restricted access, and a redaction policy specified; integrity chaining and immutable storage deferred | **Partial in v1** |
| **Transactional outbox.** In-memory `onCommit` callbacks are lost if the process dies immediately after commit. | Documented reliability limit and the future path ([08](08-platform-foundation.md), [24](24-future-expansion.md)) | **Deferred, deliberately** |
| **Data retention and deletion semantics.** Soft delete is not retention, legal hold, anonymization or erasure. | Recorded as deferred with no hooks taken | **Deferred** |
| **Cross-organization identity.** `User` is org-bound, but a shared-SaaS deployment may need practitioners or patients across clinics. | **D9 decided:** `User` stays organization-bound in v1; no `OrganizationMembership`. One deployment = one database = one `Organization`, so a membership join would carry one row per user forever — and it would not solve the problem, which is cross-*deployment* identity federation across separate databases. Recorded as a future SaaS design option in [24](24-future-expansion.md). | **Decided. Phase 3 unblocked.** |
| **Clinical terminology and versioning.** Free-text-only diagnoses, drugs and allergies block reliable decision support and reporting. | `Diagnosis.code`/`codeSystem` retained; drug and allergy terminology deferred with the interaction checker | **Deferred, hooks documented** |
| **Database topology and sharding.** Transactions, tenant indexes, hot sequence and slot documents, and cross-collection operations all interact with a future shard key. | Recorded as deferred; noted that hot `MrnSequence` and `ScheduleSlot` documents are the shapes most affected | **Deferred, flagged** |
| **Encryption and key-management threat model.** Database fields, backups, logs, uploaded documents, upload buffers and generated PDFs are all PHI surfaces. | Recorded as a per-deployment procurement question under D1 | **Deferred** |

Two of these — HTTP idempotency and optimistic concurrency — are additions to
**Phase 0**, because retrofitting either after the mutating routes exist means
touching all of them again. **None of the twelve remains open or blocking**:
each is either in v1, partially in v1 with the remainder scoped, or explicitly
deferred with its trigger recorded.

## What would change this plan

Honestly stated, because a plan that cannot be falsified is not a plan:

- **A real second customer with concrete requirements.** Would likely accelerate
  the repository extraction and could reshape the vertical model around their
  specialty rather than around nutrition.
- **A decision to sell hosted rather than per-deployment.** Would move row-level
  tenancy from deferred to Phase 3, and would make the `CacheTag` duplication a
  blocking problem rather than a small fix.
- **Production patient data existing before Phase 5.** Would make M8 and M9
  dramatically more expensive and could justify keeping the `Client` naming after
  all — the rename is cheap *only* while the data is small.
- **A regulatory requirement** (HIPAA, GDPR-as-processor, a local health
  authority). Would promote audit, retention, encryption and access review from
  "designed for" to "certified against", and would likely settle D1 immediately.

## Codex findings and resolution

Not yet consulted, and this document is where the most consequential
disagreements should surface. Per
`.claude/skills/codex-collaboration/SKILL.md`, Codex owns "identifies missing
requirements" and "identifies risks and edge cases" — so its highest-value use
here is to attack R1, R2, R5, R11 and R12, and to answer D2 and D5.

*"An independent reviewer used as a rubber stamp is worth nothing."* The review
questions in every document are deliberately phrased as challenges rather than
confirmations.
