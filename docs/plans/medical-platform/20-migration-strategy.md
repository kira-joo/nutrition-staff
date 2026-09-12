# 20 — Migration and refactor strategy

**Status: APPROVED 2026-08-22.**

## Purpose

Sequence the schema and data changes so that no phase begins with a migration it
cannot reverse, and so the two one-way migrations are rehearsed before they run.

## The nine migrations

| #   | Change                                                                                                                                                      | Phase | Reversible                                    | Rehearsal required |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------- | ------------------ |
| M1  | Migration framework + history collection                                                                                                                    | 0B    | n/a                                           | no                 |
| M2  | Indexes on every clinical FK                                                                                                                                | 0D    | ✅ drop them                                  | no                 |
| M3  | `User` gains soft delete                                                                                                                                    | 3     | ✅ additive field                             | no                 |
| M4  | `User.phone` sparse-unique index dropped                                                                                                                    | 3     | ⚠️ recreating may now fail on real duplicates | **yes**            |
| M5  | `Organization` + `Branch` created; `organizationId` backfilled everywhere                                                                                   | 3     | ✅ additive                                   | no                 |
| M6  | Settings singletons → org-scoped records                                                                                                                    | 3     | ⚠️                                            | **yes**            |
| M7  | Permission registry expands; `Role.permissions` remap                                                                                                       | 4     | ⚠️                                            | yes                |
| M8  | **`ClientProfile` → `Patient`**: collection rename, permission re-seed, role remap, MRN backfill, lifecycle split, `heightCm` extraction, allergy promotion | 5     | ❌ **one-way**                                | **yes, mandatory** |
| M9  | `ClientMeasurement` splits into `Observation` + nutrition anthropometry                                                                                     | 8     | ⚠️ source retained one release                | **yes**            |

## Ordering rules

1. **Additive before destructive.** M5 adds `organizationId` everywhere before
   anything depends on it. M3 adds soft delete before M8 starts moving patient
   data around.
2. **Permissions before renames.** M7 lands in Phase 4. **`syncPermissions`
   remains insert-only, permanently** — it runs at every server boot
   (`src/instrumentation.ts:33`), so a deactivation pass inside it would fire
   destructively on every cold start and, during a rolling deploy, an old
   instance's registry would deactivate the new instance's keys. Deactivation is
   instead an **explicitly-invoked, version-gated migration step**
   ([19](19-toolkit-and-package-changes.md)).

   What makes M8 survivable is that obsolete `Client.*` permission rows are
   _deactivated rather than deleted_ — by that explicit migration, in release R4
   — so no `Role.permissions` ObjectId reference ever dangles, and
   `resolveUserRoles` already drops inactive permissions in memory.

3. **Nothing one-way runs without a rehearsal against a restored dump.**
4. **Every migration is idempotent** and safe to re-run — the existing scripts
   already establish this convention per-script, and the framework enforces it.
5. **A migration never triggers cache revalidation.** Repositories are
   database-only and invalidation fires only from a real HTTP mutation. This is
   an existing workspace rule and migrations must not violate it.

## M8 — the `Client → Patient` rename, in detail

The only genuinely irreversible migration, and the one that touches the most
coupled thing in the codebase.

### Why now, and why it is cheap

`EntityName.CLIENT` is simultaneously the Mongoose model name, the basis of the
collection name, the prefix of 5 generated permission keys, every schema `ref`,
and a UI label key. Renaming it invalidates seeded `Permission.key` rows and
every `Role.permissions` reference pointing at them.

But: **blast radius outside this repository is zero.**
`grep -rn 'ClientProfile|Patient'` across all of `nutrition-client` returns 0
matches. No `/api/public/**` route exposes the entity. The one public write path
maps to it entirely server-side and always answers `{success:true}`. Internal
footprint: 88 files match `ClientProfile|clientProfile`, 38 match `\bClient\b`,
all inside `nutrition-staff/src`.

There is also an existing inconsistency that makes the rename a clarification
rather than a change: the class is `ClientProfileSchema` but the model name is
`"Client"`, so `EntityName.CLIENT` already means two different things depending
on where you read it.

### This is an expand/contract rollout, not a single cutover

The first draft assumed one application instance. **On a Vercel-shaped
deployment there are many**, and a rolling deploy means old and new code run
simultaneously. Two consequences the original ordering got wrong:

- Old code reads model `Client` / collection `clients`; new code reads `Patient` /
  `patients`. A rename plus archive creates a window in which one version cannot
  function.
- Old instances authorize on `Client.*`. Deactivating those permission rows makes
  old instances **lose access**, because `resolveUserRoles` drops inactive
  permissions in memory. Additive database ordering does not help if the code
  reading it is the old version.

Worse, `syncPermissions` runs **at every server boot** — verified,
`src/instrumentation.ts:33` calls it inside `register()`. So a deactivation pass
inside `syncPermissions` would fire on every cold start, during a mixed-version
window, destructively. That is now explicitly prohibited: **`syncPermissions`
stays insert-only, and deactivation is a separate, explicitly-invoked migration
step, never a startup behaviour** ([19](19-toolkit-and-package-changes.md)).

So M8 is four releases, not one:

| Release                | Contains                                                                                                                                                                                                                                        | Both versions can run?                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **R1 — expand (code)** | Code that accepts **both** `Client.*` and `Patient.*` permission keys, and reads patients through a model alias resolving to whichever collection exists. No data change.                                                                       | yes                                                                                                                 |
| **R2 — expand (data)** | Insert `Patient.*` permission rows; grant them to every role already holding the matching `Client.*`. Batched copy of `clients` → `patients` with `_id` preserved, MRN backfill, field renames. Both collections live; new writes dual-written. | yes                                                                                                                 |
| **R3 — switch**        | Reads and writes move to `patients` only. Dual-write stops. Verification runs against both collections.                                                                                                                                         | yes (old version still reads `clients`, which is now stale but intact — so a rollback is a redeploy, not a restore) |
| **R4 — contract**      | Deactivate `Client.*` permission rows. Rename `clients` → `clients_archived_<date>`. Remove the alias and the dual-write code.                                                                                                                  | no longer needed                                                                                                    |

R4 only proceeds once every instance is confirmed on R3. The gap between R3 and
R4 is the rollback window, and it is deliberately generous.

### The steps

**Preparation (no writes)**

1. Restore a production dump into a scratch database.
2. Record baseline counts: `clients`, `clientmeasurements`, `nutritionassessments`,
   `nutritioncalculations`, `clientinteractions`, `consultationrequests`, and
   every `Role.permissions` array length.
3. Run the whole migration against the scratch database and diff the results.
   **Nothing touches real data until this diff is reviewed.**

**Execution, in one transaction per step where the write set allows** 4. Create the new `patients` collection with the target schema and indexes —
including every unique index as **compound with `organizationId`**
([06](06-organization-and-branches.md)). 5. Copy every `clients` document, preserving `_id`. **Resumable and batched**, with
a high-water mark and a per-batch checksum — a single-transaction copy of a
whole collection can exceed the transaction lifetime and cache limits, and
this must be restartable. Preserving `_id` keeps the BSON references valid;
it is **not** sufficient on its own, because child schemas declare
`ref: EntityName.CLIENT` (verified in `nutrition-assessment.schema.ts:17`,
`nutrition-calculation.schema.ts:21`, `client-measurement.schema.ts:12`, and
the interaction and consultation-request schemas). Population targets a
_model_, not an `_id`. So preserved ids only work once every child schema's
`ref` and `@Relation` target is deployed consistently — which is what R1's
alias and R3's switch exist to sequence. 6. Backfill `organizationId` (from M5), and `mrn` from a fresh `MrnSequence`,
ordered by **`(createdAt, _id)`** — `createdAt` alone is not a total order and
duplicate or missing timestamps would make a rerun assign different numbers.
Migration progress is persisted so a resumed run continues rather than
restarts. 7. `lifecycle` → `crmLifecycle` (a field rename, values unchanged).
**`clinicalStatus` is set to `ACTIVE` for every migrated patient, without
exception.**

An earlier draft derived `INACTIVE` from a `crmLifecycle` of `COMPLETED` or
`LOST`. That was wrong, and it contradicted the entire reason for splitting
the two fields: commercial state is not clinical state. A patient who stopped
buying a nutrition package — or who was written off as a lost lead — still has
an active medical record, and marking it `INACTIVE` would suppress them from
clinical worklists, recall lists and safety surfaces on the strength of a
_sales_ judgement.

`crmLifecycle` is migrated unchanged and remains the CRM state. Nothing is
inferred from it.

A non-`ACTIVE` `clinicalStatus` is only ever set from an **independently
verified clinical or administrative fact** — a recorded death, a documented
transfer of care, or an explicit administrative decision. No such fact exists
anywhere in the current schema, so no migrated patient receives one. If the
real data is later found to contain a reliable signal (a note convention, an
explicit archive flag), that mapping is proposed, documented and reviewed as
its own change — never inferred inside this migration. 8. `assignedToUserId` → `assignedPractitionerId` where the target user has a
`Practitioner`; otherwise → `assignedStaffUserId`. Rows where the user has
neither are reported, not guessed. 9. Extract `heightCm` into an `Observation` (`definitionKey: "height"`,
`observedAt` = the patient's `createdAt`, with a `migrated: true` marker). 10. **Promote allergies to `PatientAlert`** — see the warning below. 11. Permission keys: **insert `Patient.*` and grant them in R2; deactivate
`Client.*` only in R4**, after every instance is on R3. Never inside
`syncPermissions`, which stays insert-only and runs at every boot. 12. Update `EntityName`, every `ref`, every DTO and every UI label in source. 13. In R4, rename `clients` → `clients_archived_<date>`. Not dropped, and not
before R4.

**What the migration does not rename, deliberately.** Child collections keep
`clientProfileId` as the field name. Renaming it to `patientId` means a second
compatibility migration across five collections, their indexes, their DTOs and
every query — for a cosmetic gain. The legacy field name is **accepted and
documented** as permanent internal vocabulary, with `Patient` as the entity name
everywhere a user or an API consumer can see. If that trade turns out to be
wrong, an additive `patientId` backfill with dual-read is the path, and it is a
separate change.

**Also to sweep, and not in the first draft:** `"Client"` and `clients` may appear
in audit payloads, cache tags, saved filters, log lines, notification payloads,
queued job arguments, serialized permission names, exports and any BI query —
even though `nutrition-client`'s _source_ is clean. R2 includes an inventory
sweep of these, and anything found is either translated or documented as
historical.

**Verification** 14. Row counts match. Every child collection's `clientProfileId` resolves to a
`patients._id`. Every role's effective permission set is unchanged in scope.
A seeded login for each role can still perform what it could before.

### The allergy promotion is a clinical-safety migration

Step 10 is not data tidying. Today allergies, medical conditions and medications
are `string[]` fields on a **point-in-time** `NutritionAssessment` — so an
allergy recorded in a patient's first assessment is invisible on their profile
and invisible to any future clinician. Promoting the latest assessment's
`allergies[]` to active `PatientAlert` rows is what makes the clinical banner
correct.

It is also the migration most likely to be wrong: free-text entries, duplicates,
negations ("no known allergies"), and severity that was never recorded.

An earlier draft promoted these straight into ordinary `PatientAlert` rows with a
guessed `severity: MODERATE`, marked unverified. **That is still too aggressive.**
An unverified flag on a record that otherwise looks exactly like a
clinician-confirmed alert will be read as clinical fact — by a doctor in a
hurry, and by every downstream feature that queries alerts. Imported free text
must be visibly a _different kind of thing_, not the same thing with an attribute.

**Imported history is a distinct provenance state, not a weaker alert.**
`PatientAlert` carries ([04](04-domain-model.md) §3):

- `provenance: IMPORTED_HISTORY | CLINICIAN_ENTERED`
- `verificationState: UNVERIFIED | VERIFIED | DISMISSED`
- `severity: UNKNOWN | LOW | MODERATE | HIGH | CRITICAL`

**And it runs as a staged review workflow, not as a direct migration.** The
review was right that writing anything into `PatientAlert` before a clinician has
looked at it is the wrong shape. So:

1. The migration writes **`ImportedClinicalHistoryCandidate`** rows — an
   immutable staging collection, never read by clinical logic.
2. A clinician reviews candidates in a dedicated screen and, per candidate,
   either promotes it to a real `PatientAlert` (setting a real severity) or
   dismisses it with a reason. Both are audited.
3. Unreviewed candidates are still **surfaced on the patient banner** as
   unverified history (see below) — they are not hidden pending review.

Rules for the migration:

- **Every** non-negated entry from **every** assessment is imported as a
  candidate, with its source date — **not only the most recent assessment.** A
  later questionnaire omitting an allergy is an omission, not a negation, and
  treating it as resolution would silently discard a real allergy. This was a
  clinical-safety error in the first draft.
- Every imported row is `provenance: IMPORTED_HISTORY`,
  `verificationState: UNVERIFIED`, **`severity: UNKNOWN`**, and
  `verifiedByPractitionerId: null`. Severity was never captured, so it is not
  guessed in either direction — and `CRITICAL` is never inferred from free text
  under any circumstance.
- `sourceAssessmentId` and `sourceField` are recorded, so every imported row
  traces back to the exact assessment and field it came from.
- **Only exact empty/null sentinels are auto-skipped.** The negation list is
  limited to exact matches on empty string, `"-"`, `"none"`, `"n/a"`, `"nil"`,
  `"لا يوجد"`, `"لا شيء"`. Anything else — `"no known drug allergies"`,
  `"no allergy except penicillin"`, misspellings, Arabic spelling variants,
  punctuation — is **imported as a candidate for review**, not discarded. A naive
  substring negation match would have dropped `"no allergy except penicillin"`.
- **No destructive deduplication.** Near-duplicates are _grouped visually_ as
  review candidates; original text is always preserved. String similarity cannot
  safely distinguish medication families, formulations, or qualified reactions.
- **Unverified history appears on the banner itself**, in a visually distinct
  high-salience state — not behind a small count affordance. The first draft
  excluded it from the banner entirely, and the review was right that this is
  unsafe: the data may contain real allergies, and a low-prominence chip is easy
  to miss. The banner must never be able to imply "no allergies" while
  unreviewed allergy candidates exist.
- It is distinct from confirmed alerts in treatment and in wording — _"unverified
  history, from a 2025 questionnaire, not confirmed"_ — so a clinician can always
  tell which is which, but never has to go looking.
- `Patient.alertSummary` continues to carry only confirmed alerts; the banner
  reads **both** it and an unverified-candidate count, and renders them as two
  clearly different things.
- Until verified, an imported entry still triggers a warning on the
  prescription screen ([11](11-encounters-clinical-records.md)) — labelled a
  **generic unverified-history match, not an allergy interaction check.**
  Comparing arbitrary free text to a free-text drug name is neither sensitive nor
  specific; calling it an interaction check would overstate it badly. Real
  drug-allergy checking needs normalized substance identifiers and is a
  [24](24-future-expansion.md) item.
- The dry run produces a **reviewable report** — every skip, every collapse,
  every import, with its source — and a clinician reviews it before the migration
  is applied. This step does not run unattended.

The design goal, stated plainly: after this migration a clinician can always tell
the difference between _"a colleague recorded this allergy"_ and _"this text was
found in a nutrition questionnaire in 2025 and nobody has checked it"_.

## M4 — dropping `User.phone` uniqueness

Reversible in principle, irreversible in practice: once two patients share a
phone number, the unique index cannot be recreated. So it is rehearsed, and the
rehearsal answers one question — how many existing users would collide.

Note the related trap the codebase already documents:
`scripts/sync-user-indexes.ts` exists because Mongoose's `autoIndex` only _adds_
missing indexes and **will not alter an existing index whose key pattern matches
but whose options differ**. So dropping the unique index requires an explicit
`dropIndex` + `syncIndexes`, not a schema change and a hope. That script is the
model.

## M9 — the measurement split

Each `ClientMeasurement` row fans out into up to 12 `Observation` rows sharing an
`observedAt` and a `measurementGroupId` (so the UI can still show "this visit's
measurements" as a set). `heightCmUsed` is preserved into
`Observation.derivationInputs` for the derived BMI row, keeping the existing
auditability. Weight, height and BMI become platform observations; the ten
anthropometric fields become nutrition-registered ones.

The source collection is **retained read-only for one release** rather than
dropped, so the split is verifiable value-by-value against it. This deliberately
accepts two sources of truth for one release as the cheaper risk — recorded as a
tradeoff, not an oversight, and flagged for Codex review in
[13](13-nutrition-vertical.md).

## The `EntityName` problem, generally

One flat enum drives model names, collection names, permission prefixes, refs and
UI labels. That coupling is why a rename is expensive, and it will bite again
(`StaffProfile → StaffMember` has the same shape, though with far less data).

**Decision: do not decouple it.** Splitting it into four independent registries
would be a large refactor whose benefit is limited to making future renames
cheaper — and after M8 there are no more renames planned. The coupling is
documented in [02](02-audit-findings.md) as L10 and left in place. Recorded as an
explicit rejection so it is not silently attempted mid-phase.

## Refactors that are not migrations

- **The pillar move** ([03](03-target-architecture.md)) — one commit, no data
  change, verified by an identical route inventory before and after.
- **The raw-utility codemod** ([17](17-ux-architecture-and-design-system.md)) —
  visually neutral because the role defaults currently equal the stock values.
- **The root-barrel import migration** ([19](19-toolkit-and-package-changes.md)) —
  mechanical, measurable by bundle size.
- **`create-client.ts`'s compensating delete** → `withTransaction`
  ([05](05-transactions-and-data-integrity.md)), plus the other five multi-write
  paths.
- **The `video(id)` cache-tag drift** — `nutrition-client` has the helper,
  `nutrition-staff` does not, so a video detail page can never be invalidated.
  A small, self-contained Phase 0D fix, done before restructuring makes it harder
  to notice.

## Rollback strategy

| Migration      | Rollback                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1, M2, M3, M5 | Drop the added indexes/fields. Safe.                                                                                                                                                                                     |
| M4             | Recreate the unique index — **only possible while no duplicates exist**.                                                                                                                                                 |
| M6             | Restore from the pre-migration dump.                                                                                                                                                                                     |
| M7             | Reactivate the deactivated permission rows; roles were only added to.                                                                                                                                                    |
| M8             | **No rollback after R4.** Before R4, rollback is a redeploy to R2/R3 — the `clients` collection is still intact. That is the entire reason for the expand/contract sequence, and the R3→R4 gap is deliberately generous. |
| M9             | The retained source collection is the rollback.                                                                                                                                                                          |

Every migration run is preceded by a full database dump, and the framework
refuses to run a destructive migration without one recorded.

## Testing strategy

- Each migration runs against a seeded fixture database with known contents and
  asserts the exact resulting shape.
- Each migration is run **twice** to prove idempotency.
- M8 gets a dedicated test asserting that every child collection's foreign key
  still resolves and that no role loses effective access.
- The permission remap is tested by taking a user with each existing role,
  recording their effective permission set before and after, and asserting the
  scope is unchanged.
- Dry-run output is asserted to contain no writes.

## Acceptance criteria

- [ ] Every migration is registered in the framework with an order and a
      recorded run history.
- [ ] Every migration is idempotent, proven by a second run.
- [ ] M4, M6, M8 and M9 rehearsed against a restored dump, with the diff reviewed.
- [ ] The allergy-promotion report reviewed by a clinician before M8 is applied.
- [ ] Every migrated patient has `clinicalStatus = ACTIVE`; no clinical status is
      derived from `crmLifecycle`.
- [ ] Imported allergy history lands in the immutable
      `ImportedClinicalHistoryCandidate` staging collection, from **all**
      assessments, not only the latest.
- [ ] Only exact sentinels are auto-skipped; every ambiguous string reaches
      review.
- [ ] Unverified history is visible **on the banner**, distinctly from confirmed
      alerts, and the banner can never imply "no allergies" while candidates are
      unreviewed.
- [ ] Promotion to `PatientAlert` requires a clinician action with a real
      severity, and is audited.
- [ ] No role loses access at any point during M7 or M8.
- [ ] All 18 public endpoints unchanged after every migration.
- [ ] `clients_archived_<date>` and `clientmeasurements` retained for one release.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict on the original design: FATALLY FLAWED
(deployment), FLAWED (allergy promotion). Both rewritten.**

| #   | Finding                                                                                                                                                                                | Sev      | Analysis                                                                                                                    | Resolution                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Preserving `_id` preserves BSON references but not population — child schemas declare `ref: EntityName.CLIENT`, and population targets a model. Step 5's claim was false in isolation. | MAJOR    | Correct. Verified in five child schemas. The doc did say "update every ref" at step 12, but step 5 overclaimed.             | **Accepted.** Step 5 now states the dependency explicitly and points at the alias/switch sequencing.                                                                                         |
| 2   | **The deployment cannot be rolling as written.** Old code reads `clients`, new code reads `patients`; rename + archive creates a window where one version cannot function.             | CRITICAL | Correct, and the first draft implicitly assumed a single instance.                                                          | **Accepted.** Rewritten as a four-release expand/contract rollout with a model alias and a dual-write window.                                                                                |
| 3   | Permission deactivation causes an access-loss window across instances, because old code authorizes on `Client.*` and `resolveUserRoles` drops inactive permissions.                    | CRITICAL | Correct. Additive _database_ ordering does not help if the _code_ reading it is old.                                        | **Accepted.** R1 ships dual-key-accepting code first; deactivation moves to R4.                                                                                                              |
| 4   | `syncPermissions` runs at startup, so an opt-in deactivation pass would fire destructively on every cold start during a mixed-version window.                                          | MAJOR    | Correct. **Verified**: `src/instrumentation.ts:33` calls it inside `register()`.                                            | **Accepted.** `syncPermissions` stays insert-only permanently; deactivation is an explicitly-invoked migration, never startup behaviour. Amended in [19](19-toolkit-and-package-changes.md). |
| 5   | The migration misses external identifiers — audit payloads, cache tags, saved filters, logs, notification payloads, queued jobs, exports, BI.                                          | MAJOR    | Correct; the first draft only checked `nutrition-client` source.                                                            | **Accepted.** R2 includes an inventory sweep.                                                                                                                                                |
| 6   | Child fields stay named `clientProfileId`, so a "reusable platform" keeps exposing legacy terminology.                                                                                 | MAJOR    | Correct as an observation. But renaming means a second compatibility migration across five collections for a cosmetic gain. | **Accepted as a documented trade-off**, not a change. Legacy field names retained deliberately; `Patient` is the name everywhere externally visible.                                         |
| 7   | A whole-collection copy in one transaction can exceed lifetime and cache limits.                                                                                                       | MAJOR    | Correct.                                                                                                                    | **Accepted.** Resumable batched copy with high-water marks and per-batch checksums.                                                                                                          |
| 8   | MRN ordering by `createdAt` alone is not deterministic across reruns.                                                                                                                  | MAJOR    | Correct.                                                                                                                    | **Accepted.** Sort by `(createdAt, _id)`, progress persisted, compound unique `(organizationId, mrn)`.                                                                                       |
| 9   | Excluding imported allergies from the banner is unsafe — a small count affordance is easy to miss, and the data may contain real allergies.                                            | CRITICAL | Correct, and it inverts the earlier instinct. Distinguishing imported from confirmed does not require hiding it.            | **Accepted.** Unverified history appears **on the banner**, in a distinct high-salience state; the banner can never imply "no allergies" while candidates are unreviewed.                    |
| 10  | Using only the most recent assessment discards knowledge — a later questionnaire omitting an allergy is not a negation.                                                                | CRITICAL | Correct, and a genuine clinical-safety error.                                                                               | **Accepted.** All assessments are imported as candidates, with source dates.                                                                                                                 |
| 11  | The negation list is naive — misses "no known drug allergies", Arabic variants, and dangerously mishandles "no allergy except penicillin".                                             | MAJOR    | Correct.                                                                                                                    | **Accepted.** Only exact sentinels auto-skip; everything ambiguous goes to review.                                                                                                           |
| 12  | Near-duplicate collapse can merge clinically different substances.                                                                                                                     | MAJOR    | Correct.                                                                                                                    | **Accepted.** Grouping is visual only; originals always preserved.                                                                                                                           |
| 13  | Free-text prescription cross-checking is unreliable and should not be called an allergy check.                                                                                         | MAJOR    | Correct.                                                                                                                    | **Accepted.** Relabelled a generic unverified-history match; real interaction checking deferred with terminology.                                                                            |
| 14  | This is safe only as a staged review workflow with an immutable candidate collection.                                                                                                  | MAJOR    | Correct, and better than the provenance-discriminator-only design.                                                          | **Accepted.** `ImportedClinicalHistoryCandidate` staging collection added; `PatientAlert` receives only clinician-promoted entries.                                                          |

**Still open:** how long unreviewed candidates may persist before the review
becomes a blocking task, and who owns that queue in a multi-practitioner clinic.
