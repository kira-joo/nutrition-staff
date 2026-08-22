# 09 — Patients

**Status: APPROVED 2026-08-22.** Phase 5.

## Purpose

Turn a nutrition sales-funnel record into a medical patient record, without
losing the CRM strengths that are the current product's differentiator.

## Current state

`ClientProfile` (model `"Client"`, collection `clients`) — `userId` unique ref,
a **required** `lifecycle` of `lead/prospect/active/paused/completed/lost`,
`dateOfBirth?`/`birthYear?`, `gender?`, `heightCm?`, `targetWeightKg?`,
`source?`/`sourceNote?`, `assignedToUserId?`, marketing consent,
`lastContactedAt?`, `nextFollowUpAt?`, `tags[]`, `generalNotes?`.

What is missing for medicine: no MRN or any human-readable identifier; no
emergency contacts (and `User.phone` is sparse-unique, so a mother and child
sharing a phone **cannot both exist**); no allergy or alert surface — allergies,
conditions and medications are `string[]` on a *point-in-time*
`NutritionAssessment`, so a penicillin allergy recorded in assessment #1 shows
nothing on the profile; no clinical status distinct from the sales funnel;
`heightCm` and `targetWeightKg` are attributes rather than measurements; and the
identity record has no soft delete while every clinical row FKs to it.

The UI is thin where it matters most. The patient context header across all six
tabs is **name + a lifecycle chip** — no MRN, no age or sex, no phone, no
assigned clinician, no next appointment, no alerts, no balance. There is no
unified timeline: measurements, assessments and calculations are three separate
card lists and interactions are a fourth tab. There is no chart on the
Measurements screen, which is the one screen where longitudinal trend is the
entire point.

What is good and must survive: the `User` ↔ optional-profile identity split; the
409 duplicate-identity resolution flow in `client-form.tsx`, which is the
best-designed UX in the app; profile completeness surfaced from a single util;
`DeltaIndicator` "since last visit"; and the append-only interaction timeline
with untamperable system entries.

## Target state

`Patient` as specified in [04](04-domain-model.md) §3, plus `PatientContact`,
`PatientAlert` and `MrnSequence`.

Key changes and why each one:

| Change | Why |
|---|---|
| `mrn`, unique per organization, searchable | Clinics identify patients by number. Reception says it on the phone. |
| `clinicalStatus` separate from `crmLifecycle` | A patient can be a *lost lead* commercially and still have a medical record that must never be treated as inactive. Conflating them is the single worst modelling error in the current schema. |
| `PatientAlert` as current state, denormalised into `Patient.alertSummary` | So the clinical banner is one read and an allergy is impossible to miss. |
| `PatientContact` as its own entity | Emergency contacts, and a contact is often itself a patient. Also the shared-phone fix. |
| `User.phone` uniqueness dropped | L10. The 409 flow becomes an advisory duplicate warning rather than a hard block. |
| `heightCm` → `Observation` | Height is measured, changes in children, and belongs on a timeline. |
| `assignedPractitionerId` + `assignedStaffUserId` | The clinician and the CRM owner are different people. Also the key `ownPatientsOnly` scoping reads. |
| `outstandingBalance`, `lastVisitAt`, `nextAppointmentAt` denormalised | The banner and the worklists need them without four extra queries; maintained transactionally. |
| `mergedIntoPatientId` | Duplicates get merged, not deleted. |

## Workflows

**Register a patient.** Reception captures name + phone in seconds (the existing
`CreateClientDto` comment says exactly this and it stays true). MRN is allocated
inside the transaction. A duplicate phone or name produces a *warning* with a
"this might be…" list and an attach-to-existing action — the current 409 flow,
made non-blocking. Transactional: [05](05-transactions-and-data-integrity.md)
workflow 1.

**Complete the record.** Progressive: demographics, contacts, alerts, consent.
Profile completeness stays as a surfaced metric — it works today and clinics
respond to it.

**Merge duplicates.** `Patient.merge` (custom permission). The loser's
encounters, observations, documents, invoices and contact attempts re-point to
the winner; the loser becomes `MERGED` and read-only, retaining
`mergedIntoPatientId`. Transactional and audited. Never a delete.

**Deactivate / deceased.** `clinicalStatus` transitions, blocking new
appointments while leaving all history readable.

## Screens

- `/patients` — the list. Keeps `FeatureTable` but gains MRN, next appointment,
  balance and alert indicators, plus the date-range and multi-select filters the
  toolkit currently lacks.
- `/patients/[id]` — the record, with a **persistent clinical banner** and tabs:
  **Summary** (the clinical summary, not a data dump), **Timeline** (unified),
  **Appointments**, **Encounters**, **Observations** (with charts),
  **Documents**, **Billing**, **CRM**, **Profile**, plus any enabled vertical's
  tab (Nutrition).
- Contextual drawers rather than page navigations for: add alert, add contact,
  log contact attempt, schedule follow-up, book appointment, record payment. The
  toolkit already ships `drawerPresentation` and the app uses it zero times.

Banner content, in priority order: name · MRN · age/sex · **active
high-severity alerts** · **unverified allergy history, if any, in a visually
distinct state** · assigned practitioner · next appointment · outstanding
balance · phone with a click-to-call/WhatsApp action.

The unverified-history line reads `ImportedClinicalHistoryCandidate`
([04](04-domain-model.md) §8), not `PatientAlert`. It exists because historical
allergies imported from old nutrition assessments are *not* clinician-confirmed
but may still be real. It is
rendered differently from a confirmed alert and worded as such — but it is on the
banner, not behind a count chip, because the banner must never be able to imply
"no allergies" while unreviewed candidates exist. See
[20](20-migration-strategy.md). At 375px it collapses to
name + MRN + alert indicator, expandable. Never colour-only for alerts — icon
plus text. Full design in [17](17-ux-architecture-and-design-system.md).

## The unified timeline

Merges, newest first: encounters (with type and signing state) · appointments
(including no-shows and cancellations, which are clinically meaningful) ·
observations (grouped per recording event, not one row per value) · documents ·
contact attempts · invoices and payments · alerts added or resolved ·
vertical-contributed entries (nutrition assessments and calculations).

The existing dashboard already proves an in-memory cross-collection merge works
(`get-dashboard-activity.ts` merges five collections, each capped at 20 then
re-sorted). That approach is correct for a dashboard and **wrong for a patient
timeline that must page** — so this is a real backend design task, not a reuse:
each source is queried with a shared cursor on `(occurredAt, _id)`, capped, then
merged; "load older" advances the cursor. Every source is indexed on
`{patientId, <timeField>}` ([04](04-domain-model.md) index plan). Filter chips by
entry type; permission-filtered per source, so a receptionist's timeline simply
has fewer rows rather than an error.

## APIs

`GET/POST /api/patients` · `GET/PUT/DELETE /api/patients/:id` ·
`GET /api/patients/:id/timeline?cursor=&types=` ·
`GET/POST /api/patients/:id/contacts` · `PUT/DELETE .../contacts/:contactId` ·
`GET/POST /api/patients/:id/alerts` · `PUT .../alerts/:alertId` ·
`POST /api/patients/:id/merge` · `GET /api/patients/:id/summary` (the banner, one
call) · `GET /api/patients/lookup?mrn=|phone=` (exact-match fast path).

PUT for updates, never PATCH — the project-wide convention.

## Validation and business rules

- MRN is server-generated and immutable. Never accepted from a client.
- `dateOfBirth` cannot be in the future; age > 120 is a warning, not an error.
- `DECEASED` blocks creating an appointment; it never blocks reading.
- A `CRITICAL` alert cannot be deleted, only resolved, and resolution is audited.
- At most one `isPrimary` contact per patient.
- A merge requires explicit confirmation naming both MRNs.
- Marketing consent withdrawal is timestamped and excludes the patient from
  every recovery and reactivation list.

## Migrations

M8 — the `Client → Patient` rename, MRN backfill, lifecycle split, `heightCm`
extraction to an `Observation`, and allergy promotion from the latest
`NutritionAssessment` to `PatientAlert` rows. **The allergy promotion is a
clinical-safety migration, not a data tidy-up**, and it must be reviewed by
someone who knows the data before it runs. Detail in
[20](20-migration-strategy.md).

## Edge cases

- A patient with no `dateOfBirth` — supported; `birthYear` gives an approximate
  age and the existing `resolve-age.ts` already returns `isApproximate: true`.
- A patient who is also staff — supported by the identity split, unchanged.
- A shared family phone — now supported. This is a fix, not an edge case.
- A patient registered from a public lead (`site-cms/leads/`) — goes through the
  same platform `registerPatient` use case, so MRN allocation and audit apply.
- Two receptionists registering the same walk-in simultaneously — both succeed
  with distinct MRNs and a duplicate warning; merge resolves it. Better than
  blocking a real registration.

## Testing strategy

MRN uniqueness under concurrency (two parallel registrations) · MRN not burned
on a rolled-back registration · alert denormalisation stays consistent with
`PatientAlert` · timeline paging returns each entry exactly once with no gaps at
a cursor boundary · timeline respects permissions per source · merge re-points
every child collection and leaves nothing orphaned · the duplicate-phone case
that 409s today now succeeds.

## Acceptance criteria

- [ ] Every patient has a unique, immutable, searchable MRN.
- [ ] A mother and child sharing a phone can both be registered.
- [ ] An allergy recorded in any encounter is visible on the banner at 375px.
- [ ] Unverified imported allergy history is visible on the banner, distinct from
      confirmed alerts, and cannot be mistaken for either a confirmed alert or an
      absence of allergies.
- [ ] The timeline merges all listed sources, pages correctly, and filters by type.
- [ ] `clinicalStatus` and `crmLifecycle` are independent, and no clinical logic
      reads the CRM funnel.
- [ ] A merge loses no data.

## Codex findings and resolution

Not yet consulted. Ask: (a) is the cursor-per-source merge the right timeline
design, or should an append-only denormalised `PatientTimelineEntry` collection
be written on commit — noting `get-dashboard-activity.ts` explicitly rejected
that once already; (b) is dropping phone uniqueness safe given the existing
duplicate-detection UX depends on the 409.
