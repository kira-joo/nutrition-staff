# 11 — Encounters and clinical records

**Status: APPROVED 2026-08-22.** Phase 7.

## Purpose

Introduce the clinical event as a first-class entity, distinct from the
appointment that scheduled it, and make it extensible by specialty without the
platform knowing any specialty.

## Current state

No encounter concept exists. The closest analogues are
`NutritionAssessment` (a point-in-time intake questionnaire, 33 fields,
~85% nutrition-specific) and `ClientMeasurement` (11 anthropometric numbers per
visit). Neither is a visit record: there is no complaint, no diagnosis, no
prescription, no clinical note, no attachment, no signing, no immutability.

There are no vitals at all — no blood pressure, heart rate, temperature,
respiratory rate, SpO2 or blood glucose anywhere in the data model. Units are
hardcoded (cm/kg) with no unit abstraction.

What is instructive: the codebase already demonstrates the immutability instinct
correctly twice. `NutritionCalculation` persists a snapshot and **never
re-runs the engine**, with `calculatedAt` carried through unchanged and only
`notes` editable afterwards. `BookEdition` is an immutable frozen snapshot with
`Book` as the mutable draft. The encounter model reuses that same discipline.

## Target state

`Encounter`, `EncounterAddendum`, `Observation`, `Diagnosis`, `Prescription`,
`PrescriptionItem`, `EncounterTemplate` — [04](04-domain-model.md) §5.

### The appointment/encounter separation

Non-negotiable per the brief, and correct: an appointment is a _plan_ that can be
cancelled or never happen; an encounter is a clinical event that did happen.
The relationship is `Encounter.appointmentId?` — optional, because:

- A **walk-in** has an encounter with no prior appointment.
- A **no-show** has an appointment with no encounter.
- A **retrospective entry** (the doctor writing up yesterday) has an encounter
  whose `startedAt` precedes its creation.
- One appointment produces at most one encounter; a second visit is a second
  appointment.

### The draft → signed lifecycle

`DRAFT` is a working document, visible to its author (and to anyone with
`Encounter.readAll`), editable, deletable.

`SIGNED` is **immutable**. Signing requires a non-empty clinical body — at least
one of chief complaint, assessment notes, or a diagnosis — plus every registered
vertical section's `signRequirements` passing. After signing, the only change is
an appended `EncounterAddendum`, which moves the status to `AMENDED`. The signed
content itself is never rewritten.

`VOIDED` requires the custom `Encounter.void` permission and a reason. A signed
encounter is never deleted.

This mirrors `BookEdition` deliberately: the codebase already has a subsystem
where "published means frozen" and the team already understands its invariants.

### Observations rather than a measurement document

One row per measured value (`definitionKey` + typed value + `observedAt`), not
one wide document per visit. The reasoning and the rejected alternative are in
[04](04-domain-model.md) §5. The consequences that matter here:

- A nurse can record blood pressure with no nutrition visit attached.
- Adding a specialty's measurements is a registry entry, not a schema change.
- "Chart this value over time" is an indexed query, not a projection over sparse
  columns — and the Measurements screen finally gets the chart it should always
  have had.
- The existing provenance discipline survives: BMI records
  `derivedFrom: ["weight","height"]` and `derivationInputs` preserves exactly
  what the derivation used, which is what `heightCmUsed` does today.

Platform-owned definitions: weight, height, BMI, systolic/diastolic BP, heart
rate, temperature, respiratory rate, SpO2, blood glucose. Nutrition registers
its 10 anthropometric definitions — [13](13-nutrition-vertical.md).

Reference ranges live on the definition and drive `isAbnormal`, which drives a
visual flag. Age- and sex-specific paediatric ranges are **out of scope** in v1
and recorded as a [24](24-future-expansion.md) item; the definition shape already
holds an array of ranges so adding them is data.

### Vertical sections

`Encounter.sections: {key, payload, updatedAt, updatedByUserId}[]`, written only
through one route that validates against the registered DTO. Full mechanism in
[12](12-vertical-extension-model.md).

### Prescriptions

Deliberately modest, per the brief's "basic medication instructions". Free-text
`drugName` — with **no** reserved `drugId` field, removed on review, since adding
a nullable reference plus a backfill when a formulary actually exists is cheaper
than a field every future reader has to ask about. Dose, route, frequency,
duration, quantity, and patient-facing `instructions` as a `LocalizedString`
because the patient reads it. Printable. No drug database, no interaction
checking, no e-prescribing, no controlled-substance handling — all
[24](24-future-expansion.md).

## Workflows

**Conduct an encounter.** Opened from the waiting board or the worklist (usually
already created in `DRAFT` by check-in). Vitals first, in a fast keyboard-driven
entry form — a nurse enters six numbers and tabs out. Then complaint, history,
examination, assessment, plan. Then diagnosis, prescription, follow-up. Then any
vertical section. Then sign.

**Sign.** One transaction writing encounter, observations, diagnoses,
prescriptions, `Patient.alertSummary` denormalisation and audit — the widest
write in the product and the one where a partial commit is a clinical-safety
issue ([05](05-transactions-and-data-integrity.md) workflow 7). Signing runs
every vertical hook; a hook may block with a named reason.

**Amend.** Append an addendum. Never edit.

**Retrospective entry.** Permitted, with `startedAt` in the past and a
`recordedLate` audit marker. Blocked beyond an org-configured window without a
permission.

## Screens

- `/patients/[id]/encounters` — list, with type, date, practitioner, status and
  diagnosis summary.
- `/encounters/[id]` — the encounter workspace. Not a form dump: a
  progressive, sectioned surface with the patient banner persistent above it, an
  unsaved-state indicator, and autosave for `DRAFT` (the pattern already exists
  in the Books content editor — `use-debounced-autosave.ts`,
  `use-unsaved-changes-guard.ts`, and a queue — and should be reused rather than
  reinvented).
- `/worklist` — the doctor's home: today's patients, drafts to finish, results to
  review. [17](17-ux-architecture-and-design-system.md).
- Vitals entry as a **drawer**, callable from the board or the encounter.

## APIs

`GET/POST /api/encounters` · `GET/PUT /api/encounters/:id` ·
`POST /api/encounters/:id/sign|void` · `POST /api/encounters/:id/addenda` ·
`PUT /api/encounters/:id/sections/:key` (the one generic section route) ·
`GET/POST /api/observations` · `GET /api/patients/:id/observations?definitionKey=&from=&to=` ·
`GET/POST/PUT/DELETE /api/diagnoses` ·
`GET/POST /api/prescriptions` · `POST /api/prescriptions/:id/issue` ·
`GET /api/prescriptions/:id/pdf` (reusing `backend-toolkit-next`'s existing
`renderHtmlToPdf`, and the manual-handler pattern the repo already uses for
binary responses) ·
`GET/POST /api/encounter-templates`.

## Validation and business rules

Signing gates listed above · a signed encounter rejects every write except an
addendum · `endedAt >= startedAt` · an observation's value must match its
definition's `valueType` and unit · an out-of-plausible-range value warns but
does not block (a real BP of 220/120 must be recordable) · a diagnosis requires
an encounter · a prescription requires at least one item · voiding requires a
reason of at least N characters.

## Files and media

Attachments are `Document` rows scoped to the encounter, via the private-delivery
path in [08](08-platform-foundation.md). Uploads happen before the signing
transaction; orphan cleanup is registered on `onAbort`.

## Audit

Every encounter create, update, sign, amend, void, and **read** is audited.
Read-auditing of a clinical body is the one place volume is accepted, because
"who opened this chart" is the question a clinic gets asked.

## Edge cases

Two practitioners editing one draft (last-write-wins is unacceptable — use the
`expectedRevision` optimistic-concurrency pattern already proven in the Books
subsystem). **The same applies beyond encounters**, which the first draft did not
say: patient demographics, alerts, invoices and appointments all need a revision
check, because two staff members editing one record concurrently is normal in a
clinic and a silent overwrite of a clinical or financial field is not acceptable.
`revision` is therefore added to every concurrently-editable entity in
[04](04-domain-model.md), and a stale write returns 409 · signing an encounter whose patient was merged mid-visit (blocked,
with a clear message) · a vertical disabled between drafting and signing
(the section renders read-only via the fallback renderer and does not block
signing) · an observation recorded against a signed encounter (allowed —
observations are their own rows with their own `observedAt`; the encounter body
is what is frozen) · a prescription for a patient with a matching allergy alert
(a hard, dismissible-with-reason warning; not a silent pass and not an
un-overridable block). **That match is a free-text string comparison and is
labelled as such** — an "unverified history match", never an "interaction check".
Real drug-allergy checking needs normalized substance identifiers and is a
[24](24-future-expansion.md) item; calling a string match an interaction check
would overstate it in exactly the direction that gets someone hurt.

## Testing strategy

Sign-then-edit is rejected in every field · addendum is the only mutation path ·
the signing transaction rolls back completely on a forced failure in each of its
five writes · optimistic concurrency rejects a stale draft update ·
`signRequirements` from a fixture vertical blocks signing with the right reason ·
observation charts return correctly ordered series across a timezone boundary ·
the allergy/prescription warning fires.

## Acceptance criteria

- [ ] A doctor completes a full encounter — vitals, notes, diagnosis,
      prescription, follow-up — and signs it.
- [ ] A signed encounter is provably immutable; amendment is append-only.
- [ ] Vitals exist as platform observations, independent of any vertical.
- [ ] A walk-in encounter with no appointment works end to end.
- [ ] The signing transaction is atomic across all five collections.
- [ ] No file under `platform/encounters/` mentions any specialty.

## Codex findings and resolution

Not yet consulted. Ask: (a) is `DRAFT|SIGNED|AMENDED|VOIDED` sufficient, or is a
separate `IN_PROGRESS` needed to distinguish "being written now" from "saved
draft"? (b) should observations be blocked once their encounter is signed?
(c) is reusing the Books autosave/concurrency machinery sound, or does the
clinical context need stronger guarantees than a book chapter?
