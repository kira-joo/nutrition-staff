# 04 — Target domain model

**Status: APPROVED 2026-08-22.**

## Purpose

The complete entity set for the first release: every field, relationship,
index, and state machine. This is the contract the feature documents implement
against.

## Conventions applied to every entity

| Convention   | Rule                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Declaration  | `@MongoSchema()` decorated class + `createMongoModel(EntityName.X, XSchema)`. No Typegoose, no `@nestjs/mongoose`.                                                                                                                                                                                                                                                                                                 |
| Timestamps   | `timestamps: true` everywhere (default).                                                                                                                                                                                                                                                                                                                                                                           |
| Soft delete  | `softDelete: true` on every entity that holds patient-relevant or financial data. **Including `User`**, which lacks it today. Immutable records (`AuditEvent`, `Payment` once settled, `BookEdition`) are never deleted at all.                                                                                                                                                                                    |
| Uniqueness   | Only via `@Unique()`. **Every unique index on a tenant-owned entity is compound with `organizationId`** — a global unique index on tenant data is a tenancy bug, not a stricter constraint. See [06](06-organization-and-branches.md).                                                                                                                                                                             |
| Tenancy      | **Every** entity except `Organization` itself carries `organizationId: ObjectId → Organization`, required, `@Filterable()`, **indexed**. See [06](06-organization-and-branches.md).                                                                                                                                                                                                                                |
| Branch       | Entities with a physical location carry `branchId?: ObjectId → Branch`, `@Filterable()`, indexed. Nullable means org-wide.                                                                                                                                                                                                                                                                                         |
| Authorship   | `createdByUserId` / `updatedByUserId` on every mutable clinical, CRM and financial entity, defaulted from the request actor context and overridable explicitly for imports, jobs and migrations — see [19](19-toolkit-and-package-changes.md).                                                                                                                                                                     |
| Concurrency  | **`revision: number`** on every concurrently-editable entity — `Encounter`, `Patient`, `PatientAlert`, `Appointment`, `Invoice`, `EncounterTemplate`. A write supplies `expectedRevision` and a mismatch is a 409, using the pattern already proven in the Books subsystem. Two staff editing one record is normal; a silent last-write-wins overwrite of a clinical or financial field is not acceptable.         |
| Indexes      | Declared explicitly. `@Filterable()` builds **no** index today (L7) — every FK and every filter field in this document gets an explicit index.                                                                                                                                                                                                                                                                     |
| Localization | Clinical and operational fields are plain strings. `LocalizedString` is used only where the _customer's patients_ read the text (service names on a printed invoice, patient-facing instructions). It is not sprayed across the clinical model.                                                                                                                                                                    |
| Money        | `Money { amountMinor: bigint; currency: string }`, never a float and never a `number` — a lifetime of minor units can pass the safe-integer limit. From `toolkit-common`, with an ISO 4217 exponent table and explicit rounding modes. Crosses the API boundary via `toMoneyJson`/`fromMoneyJson`, since `bigint` is not JSON-native. Formatting and free-text parsing deliberately live outside `toolkit-common`. |

`EntityName` gains members and loses none except `CLIENT → PATIENT`. Custom
permission actions beyond the default five are introduced in
[07](07-authorization-roles-permissions.md).

---

## 1. Organization and structure

### `Organization` — NEW

The tenant root. One row per deployment today.

| Field        | Type                                                                              | Notes                                                                                 |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `name`       | string, req                                                                       | `@Searchable`                                                                         |
| `legalName?` | string                                                                            | for invoices                                                                          |
| `slug`       | string, req                                                                       | `@Unique`                                                                             |
| `type`       | enum `OrganizationType`                                                           | `CLINIC \| MULTI_DOCTOR_PRACTICE \| MEDICAL_CENTER`                                   |
| `timezone`   | string, req, default `"Africa/Cairo"`                                             | replaces the compile-time `APP_TIMEZONE` constant                                     |
| `currency`   | string, req, default `"EGP"`                                                      | replaces the 1-member `Currency` enum                                                 |
| `locale`     | enum, default `"ar"`                                                              | patient-facing document language                                                      |
| `contact`    | embedded `{phone?, whatsapp?, email?, addressLines[], city?, country?}`           |                                                                                       |
| `branding`   | embedded `{logo?: ImageAsset, favicon?: ImageAsset, primaryColor?, accentColor?}` | drives white-label `--ftk-*` overrides, [17](17-ux-architecture-and-design-system.md) |
| `mrnFormat`  | embedded `{prefix?: string, padTo: number (default 6), includeYear: boolean}`     | see MRN below                                                                         |
| `settings`   | embedded `OrganizationSettings`                                                   | appointment defaults, invoice numbering, follow-up SLA days, no-show policy           |
| `features`   | `string[]`                                                                        | enabled vertical keys, e.g. `["nutrition"]` — [12](12-vertical-extension-model.md)    |
| `status`     | enum `Status`, req                                                                |                                                                                       |

Retires: `SiteSettings.phone/whatsappNumber/email/currencyCode` as the source of
truth for clinic identity (the CMS singleton survives as _website_ content),
`APP_TIMEZONE`, `Currency`.

### `Branch` — NEW

| Field            | Type                                                                   | Notes                                                  |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `organizationId` | ref, req                                                               | indexed                                                |
| `name`           | string, req                                                            | `@Searchable`                                          |
| `code`           | string, req                                                            | `@Unique` per org (compound)                           |
| `contact`        | embedded, as above                                                     |                                                        |
| `timezone?`      | string                                                                 | overrides the org's; a real multi-city centre needs it |
| `openingHours`   | `WeeklyHours[]` — `{dayOfWeek 0-6, opensAt "HH:mm", closesAt "HH:mm"}` |                                                        |
| `status`         | enum `Status`, req                                                     |                                                        |

### `Resource` — NEW

Rooms, chairs, and equipment, unified. A dental chair and a consultation room
are the same scheduling constraint.

| Field                        | Type                  | Notes                                                                                                                                                                                                                           |
| ---------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationId`, `branchId` | refs, req             | indexed                                                                                                                                                                                                                         |
| `name`, `code`               | string, req           |                                                                                                                                                                                                                                 |
| `type`                       | enum `ResourceType`   | `ROOM \| CHAIR \| EQUIPMENT`. **No `BED`** — an inpatient bed is not a schedulable outpatient resource, and adding the member now would create domain vocabulary with no v1 meaning. Admissions adds it when admissions exists. |
| `capacity`                   | number, default 1     |                                                                                                                                                                                                                                 |
| `isSchedulable`              | boolean, default true |                                                                                                                                                                                                                                 |
| `status`                     | enum `Status`, req    |                                                                                                                                                                                                                                 |

---

## 2. Identity, staff, practitioners

### `User` — EVOLVED

Kept as the pure identity record. The split (`User` + optional independent
satellites, nothing inferred from `roles`) is the best structural decision in
the existing codebase and is preserved verbatim.

Changes:

| Change                                     | Reason                                                                                                                                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`softDelete: true`**                     | L9. Today a hard delete orphans the entire clinical graph.                                                                                                                                                                                                     |
| **`phone` drops `@Unique({sparse:true})`** | L10 — a mother and child sharing a phone currently 409s. Replaced by a **non-unique index** plus a duplicate-detection _warning_ surfaced in the registration UI (the existing 409-resolution flow in `client-form.tsx` becomes advisory instead of blocking). |
| `email` keeps `@Unique({sparse:true})`     | Email is a login credential; phone is not.                                                                                                                                                                                                                     |
| `+ organizationId`                         | required, indexed                                                                                                                                                                                                                                              |
| `+ nationalId?`                            | string, `@Unique({sparse:true})` per org — the identifier a clinic actually asks for                                                                                                                                                                           |
| `+ preferredLanguage?`                     | enum                                                                                                                                                                                                                                                           |
| `+ lastLoginAt?`                           | Date                                                                                                                                                                                                                                                           |

### `StaffMember` — RENAMED from `StaffProfile`

Today it has exactly two fields (`salary?`, `joinedAt?: string`) and is a stub.

| Field              | Type                | Notes                                            |
| ------------------ | ------------------- | ------------------------------------------------ |
| `userId`           | ref, req, `@Unique` | unchanged                                        |
| `organizationId`   | ref, req            |                                                  |
| `primaryBranchId?` | ref                 |                                                  |
| `employeeCode?`    | string              | `@Unique` per org                                |
| `jobTitle?`        | string              |                                                  |
| `employmentType`   | enum                | `FULL_TIME \| PART_TIME \| CONTRACT \| VISITING` |
| `joinedAt?`        | **Date**            | was a `string` — a bug, fixed by M-staff         |
| `leftAt?`          | Date                |                                                  |
| `salary?`          | Money               | was a bare number                                |
| `status`           | enum `Status`, req  |                                                  |

### `Practitioner` — NEW

The entity `DoctorProfile` is not. A clinician who can hold appointments, sign
encounters, and appear on a schedule.

| Field                               | Type                  | Notes                                          |
| ----------------------------------- | --------------------- | ---------------------------------------------- |
| `userId`                            | ref, req, `@Unique`   | a practitioner is always a `User`              |
| `organizationId`                    | ref, req              |                                                |
| `branchIds`                         | `ref[]`, default `[]` | empty = all branches                           |
| `specialties`                       | `string[]`, req       | vertical keys plus free text, `@Filterable`    |
| `licenseNumber?`                    | string                |                                                |
| `licenseExpiresAt?`                 | Date                  | drives an expiry notification                  |
| `qualifications`                    | `string[]`            |                                                |
| `title?`                            | string                | "Dr.", "Prof."                                 |
| `displayName`                       | string, req           | `@Searchable` — what patients see              |
| `avatar?`                           | ImageAsset            |                                                |
| `defaultAppointmentDurationMinutes` | number, default 30    |                                                |
| `colorToken?`                       | string                | the practitioner's lane colour in the calendar |
| `acceptsNewPatients`                | boolean, default true |                                                |
| `status`                            | enum `Status`, req    |                                                |

`DoctorProfile` is **not** renamed and **not** retired — it stays in `site-cms/`
as the public "about the doctor" marketing page it actually is. Its 5 permission
keys and its `DOCTOR_PROFILE` cache tag (shared with `nutrition-client`) are
therefore untouched, which removes a whole class of migration risk.

### `PractitionerAvailability` — NEW

| Field                                          | Type      | Notes                                                                                                            |
| ---------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `organizationId`, `practitionerId`, `branchId` | refs, req | compound indexed                                                                                                 |
| `kind`                                         | enum      | `RECURRING_WEEKLY \| EXCEPTION_AVAILABLE \| EXCEPTION_UNAVAILABLE`                                               |
| `dayOfWeek?`                                   | 0–6       | recurring only                                                                                                   |
| `date?`                                        | Date      | exception only                                                                                                   |
| `startTime`, `endTime`                         | `"HH:mm"` | wall-clock in the branch timezone, **not** a UTC instant — a recurring 09:00 must stay 09:00 across a DST change |
| `slotMinutes?`                                 | number    | overrides the practitioner default                                                                               |
| `resourceId?`                                  | ref       | pins the slot to a room                                                                                          |
| `note?`                                        | string    |                                                                                                                  |

Deliberately **not** RRULE. Weekly recurrence plus dated exceptions covers every
clinic pattern observed in the brief; a full recurrence engine is a
[24](24-future-expansion.md) item.

---

## 3. Patient

### `Patient` — RENAMED from `ClientProfile`

The rename is `EntityName.CLIENT → EntityName.PATIENT`, model `"Client"` →
`"Patient"`, collection `clients` → `patients`. Blast radius outside this repo:
zero. See [20](20-migration-strategy.md) for the migration.

| Field                                      | Type                              | Change                              | Notes                                                                                                                                     |
| ------------------------------------------ | --------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationId`                           | ref, req                          | NEW                                 | indexed                                                                                                                                   |
| `userId`                                   | ref, req, `@Unique`               | kept                                | the identity                                                                                                                              |
| `mrn`                                      | string, req                       | **NEW**                             | `@Unique` per org, indexed, `@Searchable`                                                                                                 |
| `primaryBranchId?`                         | ref                               | NEW                                 | `@Filterable`                                                                                                                             |
| `clinicalStatus`                           | enum `PatientClinicalStatus`, req | **NEW**                             | `ACTIVE \| INACTIVE \| DECEASED \| TRANSFERRED_OUT \| MERGED`                                                                             |
| `crmLifecycle`                             | enum `CrmLifecycle`, req          | **RENAMED** from `lifecycle`        | `LEAD \| PROSPECT \| ACTIVE \| PAUSED \| COMPLETED \| LOST` — now explicitly the _sales_ funnel, no longer masquerading as clinical state |
| `dateOfBirth?`                             | Date                              | kept                                |                                                                                                                                           |
| `birthYear?`                               | number                            | kept                                | approximation fallback; drives `isApproximate` in age resolution                                                                          |
| `gender?`                                  | enum `Gender`                     | kept                                |                                                                                                                                           |
| `bloodGroup?`                              | enum                              | NEW                                 |                                                                                                                                           |
| `maritalStatus?`                           | enum                              | NEW                                 |                                                                                                                                           |
| `occupation?`                              | string                            | NEW                                 | moved off the nutrition assessment                                                                                                        |
| `heightCm?`                                | —                                 | **MOVED**                           | becomes an `Observation`. Height is a measurement, not an attribute.                                                                      |
| `targetWeightKg?`                          | —                                 | **MOVED**                           | to the nutrition vertical's care-plan data                                                                                                |
| `source?`, `sourceNote?`                   | enum/string                       | kept                                | CRM                                                                                                                                       |
| `referredByPatientId?`                     | ref                               | NEW                                 | real referral tracking                                                                                                                    |
| `assignedPractitionerId?`                  | ref                               | **RENAMED** from `assignedToUserId` | `@Filterable`, indexed — the scoping key for "my patients"                                                                                |
| `assignedStaffUserId?`                     | ref                               | NEW                                 | the CRM owner, distinct from the clinician                                                                                                |
| `marketingConsent?`, `marketingConsentAt?` | boolean/Date                      | kept                                |                                                                                                                                           |
| `lastContactedAt?`                         | Date                              | kept                                | write-through cache, backdating-guarded                                                                                                   |
| `nextFollowUpAt?`                          | Date                              | kept                                | `@Filterable`, indexed                                                                                                                    |
| `lastVisitAt?`, `nextAppointmentAt?`       | Date                              | NEW                                 | denormalised for the patient banner and the worklists                                                                                     |
| `outstandingBalance`                       | Money, default 0                  | NEW                                 | denormalised, maintained transactionally with `Invoice`/`Payment`                                                                         |
| `tags`                                     | `string[]`                        | kept                                | `@Filterable`                                                                                                                             |
| `alertSummary`                             | `PatientAlertSummary[]` embedded  | **NEW**                             | a denormalised copy of active high-severity alerts, so the clinical banner is one read. Source of truth is `PatientAlert`.                |
| `generalNotes?`                            | string                            | kept                                |                                                                                                                                           |
| `mergedIntoPatientId?`                     | ref                               | NEW                                 | duplicate resolution without deletion                                                                                                     |

**`clinicalStatus` transitions:** `ACTIVE ⇄ INACTIVE`; `ACTIVE → DECEASED`
(terminal, blocks new appointments, never blocks reading history);
`ACTIVE → TRANSFERRED_OUT` (terminal-ish, reversible by an explicit action);
`* → MERGED` (terminal, sets `mergedIntoPatientId`, record becomes read-only).

**MRN generation.** A per-organization human-readable sequence. Nothing in the
codebase generates sequences atomically today (`BookEdition.editionNumber` is
computed in app code and is not safe). Design:

```
MrnSequence { organizationId (unique), scope: string, nextValue: number }
```

Allocation is a single `findOneAndUpdate({organizationId, scope}, {$inc: {nextValue: 1}}, {new: true, upsert: true})`
— atomic at the document level — executed **inside** the registration
transaction so a failed registration does not burn a number, and so two
concurrent registrations cannot collide. `scope` is `"global"` today and exists
so a per-branch or per-year scheme is a data change rather than a schema change.
Formatted via `Organization.mrnFormat`, e.g. `P-2026-000042`. `Patient.mrn` also
carries a `@Unique` per-org index as the backstop.

### `PatientContact` — NEW

Emergency and related contacts. A separate entity, not an embedded array,
because a contact is often itself a patient (`linkedPatientId`) and because
relationships are queried ("who lists this patient as next of kin").

| Field                         | Type                       | Notes                                                       |
| ----------------------------- | -------------------------- | ----------------------------------------------------------- |
| `organizationId`, `patientId` | refs, req                  | indexed                                                     |
| `name`                        | string, req                |                                                             |
| `relationship`                | enum `ContactRelationship` | `SPOUSE \| PARENT \| CHILD \| SIBLING \| GUARDIAN \| OTHER` |
| `phone?`, `email?`            | string                     | **not unique** — this is the shared-family-phone fix        |
| `isEmergencyContact`          | boolean, default false     |                                                             |
| `isPrimary`                   | boolean, default false     | at most one per patient, enforced in the service            |
| `canReceiveClinicalInfo`      | boolean, default false     | consent flag                                                |
| `linkedPatientId?`            | ref                        |                                                             |

### `PatientAlert` — NEW

The fix for the single worst clinical-safety gap found in the audit: allergies,
conditions and medications live today as `string[]` on a _point-in-time_
`NutritionAssessment` row, so a penicillin allergy recorded in assessment #1
shows nothing on the patient's profile.

| Field                                      | Type                            | Notes                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationId`, `patientId`              | refs, req                       | indexed                                                                                                                                                                                        |
| `type`                                     | enum `PatientAlertType`, req    | `ALLERGY \| INTOLERANCE \| CHRONIC_CONDITION \| MEDICATION \| PRECAUTION \| ADMINISTRATIVE`                                                                                                    |
| `severity`                                 | enum `AlertSeverity`, req       | **`UNKNOWN`** `\| LOW \| MODERATE \| HIGH \| CRITICAL`. `UNKNOWN` exists because imported history has no recorded severity and guessing one — in either direction — is worse than admitting it |
| `provenance`                               | enum `AlertProvenance`, req     | `CLINICIAN_ENTERED \| IMPORTED_HISTORY`. `@Filterable`                                                                                                                                         |
| `verificationState`                        | enum, req, default `UNVERIFIED` | `UNVERIFIED \| VERIFIED \| DISMISSED`. `@Filterable`                                                                                                                                           |
| `label`                                    | string, req                     | `@Searchable`                                                                                                                                                                                  |
| `detail?`                                  | string                          |                                                                                                                                                                                                |
| `onsetDate?`, `resolvedAt?`                | Date                            |                                                                                                                                                                                                |
| `isActive`                                 | boolean, default true           | `@Filterable`                                                                                                                                                                                  |
| `recordedInEncounterId?`                   | ref                             | provenance                                                                                                                                                                                     |
| `sourceAssessmentId?`, `sourceField?`      | ref / string                    | set only for `IMPORTED_HISTORY`, so every imported row traces to the exact assessment field it came from                                                                                       |
| `verifiedByPractitionerId?`, `verifiedAt?` | ref / Date                      | set when promoted to `VERIFIED`                                                                                                                                                                |
| `dismissedReason?`                         | string                          | required to dismiss                                                                                                                                                                            |

**Only `CLINICIAN_ENTERED` or `VERIFIED` alerts of `HIGH`/`CRITICAL` severity are
denormalised into `Patient.alertSummary`**, transactionally, so the clinical
banner never needs a second query. `IMPORTED_HISTORY` / `UNVERIFIED` rows are
deliberately excluded from that strip — they surface through a separate,
visually distinct "unverified history" affordance that prompts verification, so
free text imported from an old questionnaire can never be mistaken for a
colleague's confirmed finding. See [20](20-migration-strategy.md) for the
migration and [17](17-ux-architecture-and-design-system.md) for the treatment.
Never colour-only in the UI.

Verification and dismissal are both audited, and dismissal requires a reason.

---

## 4. Scheduling

### `AppointmentType` — NEW

| Field                    | Type                   | Notes                                                 |
| ------------------------ | ---------------------- | ----------------------------------------------------- |
| `organizationId`         | ref, req               |                                                       |
| `name`                   | LocalizedString, req   | patients see it on a reminder                         |
| `code`                   | string, req            | `@Unique` per org                                     |
| `defaultDurationMinutes` | number, req            |                                                       |
| `color`                  | string, req            |                                                       |
| `requiresResourceType?`  | enum `ResourceType`    |                                                       |
| `defaultServiceIds`      | `ref[]`                | pre-fills the invoice — the billing seam              |
| `verticalKey?`           | string                 | e.g. `"nutrition"`, so a type can be specialty-scoped |
| `allowOnlineBooking`     | boolean, default false | present for the deferred portal; unused in v1         |
| `status`                 | enum `Status`, req     |                                                       |

### `Appointment` — NEW

| Field                                                       | Type                          | Notes                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `organizationId`, `branchId`                                | refs, req                     | indexed                                                                                                                |
| `patientId`                                                 | ref, req                      | indexed                                                                                                                |
| `practitionerId`                                            | ref, req                      | indexed                                                                                                                |
| `appointmentTypeId`                                         | ref, req                      |                                                                                                                        |
| `resourceId?`                                               | ref                           |                                                                                                                        |
| `startAt`, `endAt`                                          | Date, req                     | UTC instants. **Compound index `{practitionerId, startAt}`** and `{branchId, startAt}` — these two carry the calendar. |
| `status`                                                    | enum `AppointmentStatus`, req | see below                                                                                                              |
| `isWalkIn`                                                  | boolean, default false        |                                                                                                                        |
| `reason?`                                                   | string                        |                                                                                                                        |
| `notes?`                                                    | string                        | internal                                                                                                               |
| `bookedByUserId`                                            | ref, req                      |                                                                                                                        |
| `checkedInAt?`, `startedAt?`, `completedAt?`                | Date                          |                                                                                                                        |
| `cancelledAt?`, `cancelledByUserId?`, `cancellationReason?` |                               |                                                                                                                        |
| `rescheduledFromAppointmentId?`                             | ref                           | keeps the chain instead of mutating history                                                                            |
| `encounterId?`                                              | ref                           | set at check-in                                                                                                        |
| `remindersSentAt`                                           | `Date[]`                      |                                                                                                                        |

**Status machine.** `SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`,
with `SCHEDULED|CONFIRMED → CANCELLED`, `SCHEDULED|CONFIRMED → NO_SHOW` (only
after `endAt` has passed), and `SCHEDULED|CONFIRMED → RESCHEDULED` (terminal on
the old row; a new row is created). A walk-in is created directly at
`CHECKED_IN`. Every transition is guarded server-side, audited, and validated as
a transition rather than a free assignment — an illegal move is a 409, not a
silent write.

**Conflict rule.** No two non-terminal appointments for the same
`practitionerId` may overlap `[startAt, endAt)`; the same holds per
`resourceId`. A unique index cannot express interval overlap, so the check is a
query inside the booking transaction ([05](05-transactions-and-data-integrity.md),
workflow 5). Double-booking is permitted only with an explicit
`allowOverlap` override carrying a reason, which is audited.

### `ScheduleSlot` + `SlotCapacityOverride` — NEW

The serialization point that makes the no-double-booking invariant provable.
Pre-materialized, one row per bookable time bucket per scope. A booking claims
every bucket its interval covers with a conditional atomic update, so competing
bookings contend on the same document and capacity is enforced by the write
rather than by a read. Full design — and the reason a transaction alone is
insufficient — in [10](10-appointments-scheduling.md).

| Field            | Type              | Notes                                         |
| ---------------- | ----------------- | --------------------------------------------- |
| `organizationId` | ref, req          |                                               |
| `scopeType`      | enum              | `PRACTITIONER \| RESOURCE`                    |
| `scopeId`        | ObjectId, req     | the practitioner or resource                  |
| `slotStart`      | Date, req         | exact bucket boundary, UTC instant            |
| `capacity`       | number, default 1 | raised only by an audited override            |
| `consumed`       | number, default 0 | `$inc`-ed under a `consumed < capacity` guard |
| `appointmentIds` | ObjectId[]        | what consumed it, for diagnosis               |

`@Unique` on `{organizationId, scopeType, scopeId, slotStart}`. Materialized by a
job over the scheduling horizon, **never upserted inside a booking transaction**.

`SlotCapacityOverride {organizationId, slotIds[], appointmentId, grantedByUserId, reason, grantedAt}`
— overbooking modelled as capacity with an audited author, not a bypass flag.

### `WaitingListEntry` — NEW

Drives the waiting/check-in board without overloading `Appointment`.

| Field                                     | Type                   | Notes                                          |
| ----------------------------------------- | ---------------------- | ---------------------------------------------- |
| `organizationId`, `branchId`, `patientId` | refs, req              |                                                |
| `appointmentId?`                          | ref                    | absent for a pure walk-in                      |
| `practitionerId?`                         | ref                    |                                                |
| `state`                                   | enum                   | `WAITING \| WITH_PRACTITIONER \| DONE \| LEFT` |
| `arrivedAt`                               | Date, req              |                                                |
| `calledAt?`, `finishedAt?`                | Date                   |                                                |
| `priority`                                | enum, default `NORMAL` | `NORMAL \| URGENT`                             |

---

## 5. Clinical record

### `Encounter` — NEW. Deliberately not an appointment.

An appointment is a _plan_; an encounter is the _clinical event_. The brief
insists on the separation and the audit confirms nothing like it exists today.

| Field                                  | Type                          | Notes                                                                                                                                                                           |
| -------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationId`, `branchId`           | refs, req                     | indexed                                                                                                                                                                         |
| `patientId`                            | ref, req                      | **indexed** — this is the patient timeline's hot path                                                                                                                           |
| `practitionerId`                       | ref, req                      | indexed                                                                                                                                                                         |
| `appointmentId?`                       | ref                           | absent for a walk-in or a retrospective entry                                                                                                                                   |
| `encounterNumber`                      | string, req                   | `@Unique` per org, same sequence mechanism as MRN                                                                                                                               |
| `type`                                 | enum `EncounterType`, req     | `CONSULTATION \| FOLLOW_UP \| PROCEDURE \| TELECONSULTATION \| WALK_IN`                                                                                                         |
| `verticalKey?`                         | string                        | which specialty's template applied, `@Filterable`                                                                                                                               |
| `templateId?`                          | ref → `EncounterTemplate`     |                                                                                                                                                                                 |
| `startedAt`                            | Date, req                     | indexed with `patientId`                                                                                                                                                        |
| `endedAt?`                             | Date                          |                                                                                                                                                                                 |
| `chiefComplaint?`                      | string                        |                                                                                                                                                                                 |
| `historyOfPresentIllness?`             | string                        |                                                                                                                                                                                 |
| `examinationNotes?`                    | string                        |                                                                                                                                                                                 |
| `assessmentNotes?`                     | string                        |                                                                                                                                                                                 |
| `planNotes?`                           | string                        |                                                                                                                                                                                 |
| `sections`                             | `EncounterSection[]` embedded | `{key, schemaVersion, payload, updatedAt, updatedByUserId}`. The vertical extension point, with a mandatory persisted schema version — see [12](12-vertical-extension-model.md) |
| `followUpInstructions?`                | string                        |                                                                                                                                                                                 |
| `followUpAt?`                          | Date                          | feeds `Patient.nextFollowUpAt`                                                                                                                                                  |
| `status`                               | enum `EncounterStatus`, req   | `DRAFT \| SIGNED \| AMENDED \| VOIDED`                                                                                                                                          |
| `signedAt?`, `signedByPractitionerId?` |                               |                                                                                                                                                                                 |
| `voidedAt?`, `voidReason?`             |                               | a signed encounter is never deleted                                                                                                                                             |

**Status machine.** `DRAFT → SIGNED` (requires a non-empty clinical body and at
least one of complaint/assessment/diagnosis; validated server-side).
`SIGNED → AMENDED` **only** by appending an `EncounterAddendum` — the signed
content is immutable, exactly as `BookEdition` is immutable in the Books
subsystem, and for the same reason. `SIGNED|AMENDED → VOIDED` requires a reason
and a permission (`Encounter.void`, a custom action). `DRAFT` may be deleted;
nothing else may.

The four narrative fields are named after the SOAP/clinical convention rather
than invented, so a clinician recognises the form and a future FHIR mapping is
mechanical.

### `EncounterAddendum` — NEW

`{organizationId, encounterId, body, authorPractitionerId, createdAt}`.
Append-only. This is how a signed record changes.

### `Observation` — NEW. Replaces the platform half of `ClientMeasurement`.

One row per measured value, not one row per visit. This is the decision that
lets vitals, anthropometry, and any future lab result share a timeline, a chart,
and a permission.

| Field                         | Type        | Notes                                                                                                                                             |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizationId`, `patientId` | refs, req   | indexed                                                                                                                                           |
| `encounterId?`                | ref         | absent for a nurse-station reading                                                                                                                |
| `definitionKey`               | string, req | `@Filterable`, indexed with `patientId` — e.g. `"weight"`, `"height"`, `"bmi"`, `"bp_systolic"`, `"waist_circumference"`, `"body_fat_percentage"` |
| `valueNumber?`                | number      |                                                                                                                                                   |
| `valueString?`                | string      |                                                                                                                                                   |
| `valueBoolean?`               | boolean     |                                                                                                                                                   |
| `unit?`                       | string      |                                                                                                                                                   |
| `observedAt`                  | Date, req   | indexed with `patientId, definitionKey`                                                                                                           |
| `recordedByUserId`            | ref, req    |                                                                                                                                                   |
| `method?`                     | string      | e.g. the existing `bodyCompositionMethod`                                                                                                         |
| `derivedFrom?`                | `string[]`  | provenance: BMI records `["weight","height"]`                                                                                                     |
| `derivationInputs?`           | embedded    | preserves the existing `heightCmUsed` pattern — the auditable snapshot of what the derivation actually used                                       |
| `isAbnormal?`                 | boolean     | resolved against the definition's reference range                                                                                                 |
| `note?`                       | string      |                                                                                                                                                   |
| `verticalKey?`                | string      | `null` for platform vitals, `"nutrition"` for anthropometry                                                                                       |

`ObservationDefinition` is **code-declared**, not a collection: `{key, label,
unit, valueType, referenceRanges, verticalKey?, chartable}`. The platform owns
weight, height, BMI, blood pressure, heart rate, temperature, respiratory rate,
SpO2, blood glucose. The nutrition vertical registers waist, hip, chest, neck,
arm, thigh, body-fat %, muscle mass, body water %, visceral fat level. This is
the split the brief asks for, and it is a registry entry rather than a schema
change per specialty.

Rejected alternative: keep one wide `Measurement` document per visit. It cannot
represent a nurse taking blood pressure without a nutrition visit, it forces a
schema change per specialty, and it makes "chart this one value over time" a
projection over sparse columns.

### `Diagnosis` — NEW

| Field                                        | Type                   | Notes                                                                                                        |
| -------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `organizationId`, `patientId`, `encounterId` | refs, req              | indexed                                                                                                      |
| `label`                                      | string, req            | `@Searchable`                                                                                                |
| `code?`, `codeSystem?`                       | string                 | the ICD-10/SNOMED seam. **No terminology ships in v1** — the pair exists so adopting one is not a migration. |
| `category`                                   | enum                   | `PRIMARY \| SECONDARY \| PROVISIONAL \| RULED_OUT`                                                           |
| `certainty`                                  | enum                   | `SUSPECTED \| CONFIRMED`                                                                                     |
| `isChronic`                                  | boolean, default false | a chronic confirmed diagnosis offers to create a `PatientAlert`                                              |
| `onsetDate?`, `resolvedAt?`                  | Date                   |                                                                                                              |
| `notes?`                                     | string                 |                                                                                                              |

### `Prescription` + `PrescriptionItem` — NEW

Basic medication instructions, per the brief. Not a drug database, not
interaction checking, not e-prescribing.

`Prescription`: `{organizationId, patientId, encounterId, practitionerId,
issuedAt, status: DRAFT|ISSUED|CANCELLED, notes?, printedAt?}`.
`PrescriptionItem`: `{prescriptionId, drugName (string, @Searchable), form?,
strength?, dose?, route?, frequency?, durationDays?, quantity?, instructions?
(LocalizedString — the patient reads this), refills?}`.

Free-text `drugName` is deliberate — a drug catalogue is a
[24](24-future-expansion.md) item. **No reserved `drugId?` field**: adding a
formulary later means adding a nullable reference and a backfill, which is a
smaller cost than a field every future reader has to ask about.

### `EncounterTemplate` — NEW

The data-driven half of the vertical model. Full field list in
[12](12-vertical-extension-model.md).

---

## 6. CRM

### `ContactAttempt` — RENAMED and generalised from `ClientInteraction`

The existing module is the best business logic in the repository and its
invariants are preserved exactly: the `CONTACT_TYPES` set decides whether
`lastContactedAt` moves (a `NOTE` does not), a backdating guard stops an older
contact regressing the cache, and `isSystemGenerated` rows throw
`ForbiddenError` on update or delete so the audit trail is untamperable.

Changes: `+organizationId`; `clientProfileId → patientId`; `type` gains
`APPOINTMENT_REMINDER`, `NO_SHOW_FOLLOW_UP`, `PAYMENT_REMINDER`,
`PRESCRIPTION_SENT`; `+ outcome?` enum (`REACHED | NO_ANSWER | WRONG_NUMBER |
REFUSED | RESCHEDULED`); `+ channel?` enum; `+ relatedAppointmentId?`,
`+ relatedInvoiceId?`. The `nextFollowUpAt` write-through stays.

### `Task` — NEW

`{organizationId, branchId?, title, description?, patientId?, assignedToUserId?,
dueAt?, priority, status: OPEN|IN_PROGRESS|DONE|CANCELLED, sourceType?,
sourceId?, createdByUserId, completedAt?}`. Indexed `{assignedToUserId, status,
dueAt}` — that index _is_ the worklist.

`FollowUp` is **not** a separate entity. `Patient.nextFollowUpAt` plus
`Encounter.followUpAt` plus `Task` cover every case in the brief, and a fourth
overlapping concept would be the kind of speculative structure the brief forbids.
Recorded as an explicit rejection.

---

## 7. Billing

### `Service` — NEW

The clinical service catalogue. **Not** the existing `Package`, which is
pricing-page marketing content and stays in `site-cms/`.

`{organizationId, name: LocalizedString, code (@Unique per org), category?,
defaultPrice: Money, taxRatePercent?, durationMinutes?, verticalKey?,
requiresPractitioner, isSessionBased, sessionCount?, status}`.

### `Invoice` — NEW

`{organizationId, branchId, patientId, invoiceNumber (@Unique per org, sequence),
encounterId?, appointmentId?, issuedAt, dueAt?, status, subtotal, discountTotal,
taxTotal, total, paidTotal, balance (all Money), currency, notes?, voidedAt?,
voidReason?}`.

**No `payerId`.** An earlier draft carried a nullable insurance seam. Removed —
it is domain vocabulary with no v1 behaviour, and insurance will bring a `Payer`
entity, eligibility and claims when it arrives, at which point a nullable field
saved nothing. See [24](24-future-expansion.md).

**Status machine.** `DRAFT → ISSUED → PARTIALLY_PAID → PAID`; `ISSUED|PARTIALLY_PAID → OVERDUE`
(derived, by a scheduled evaluation, not stored ad hoc);
`DRAFT|ISSUED|PARTIALLY_PAID → VOIDED` with a reason. **A `PAID` invoice is never
edited** — it is voided and reissued, or credited. Totals are recomputed
server-side from lines on every mutation and never trusted from the client.

### `InvoiceLine` — NEW

`{invoiceId, serviceId?, description, quantity, unitPrice, discount?, taxRatePercent?, lineTotal (Money), encounterId?}`.

### `Payment` — NEW

`{organizationId, branchId, patientId, invoiceId?, amount: Money, method: CASH|CARD|BANK_TRANSFER|WALLET|OTHER, receivedAt, receivedByUserId, reference?, status: SETTLED|REFUNDED|VOIDED, refundOfPaymentId?, note?}`.
Append-only in spirit: a mistake is corrected by a reversing payment, never by
editing history. Every payment write is transactional together with the invoice
status and `Patient.outstandingBalance` ([05](05-transactions-and-data-integrity.md),
workflows 12–13).

### `Discount` — NEW

`{organizationId, name, code?, kind: PERCENT|FIXED, value, appliesTo: INVOICE|LINE, maxAmount?, validFrom?, validTo?, requiresPermission?, status}`.
A discount above a configured threshold requires the custom `Invoice.discount`
permission — a real clinic control, and the reason custom permission actions are
needed at all.

---

## 8. Cross-cutting

### `AuditEvent` — NEW. Append-only, never soft-deleted, never edited.

`{organizationId, branchId?, actorUserId?, actorRoleNames[], action (e.g. "Patient.update"), entityName, entityId, patientId? (indexed — "who touched this patient's record"), summary?, changes? (field-level before/after, redaction-aware), ip?, userAgent?, occurredAt, requestId?}`.

Indexed `{organizationId, occurredAt}`, `{patientId, occurredAt}`,
`{entityName, entityId, occurredAt}`. `changes` is capped and redacts fields
marked sensitive so the audit log never becomes a second copy of the record.

### `Document` — NEW

`{organizationId, patientId?, encounterId?, kind: LAB_REPORT|IMAGING|REFERRAL|CONSENT|ID_DOCUMENT|INVOICE_COPY|OTHER, title, asset: DocumentAsset, mimeType, sizeBytes, uploadedByUserId, tags[]}`.

**No `isPatientVisible`.** Removed as a speculative portal seam — there is no
patient-facing surface in v1, so the flag would have no behaviour and would imply
one exists.

`DocumentAsset` and private/signed delivery are toolkit work — the current
`AssetProvider` is `image|video` only and every asset is a permanent public URL,
which is disqualifying for PHI. See [19](19-toolkit-and-package-changes.md).

### `ImportedClinicalHistoryCandidate` — NEW

Immutable staging for clinical history imported from free text, so unreviewed
data can be surfaced without ever being mistaken for a clinician's finding.
Never read by clinical decision logic — only by the review screen and the
banner's unverified-history indicator.

`{organizationId, patientId, kind: ALLERGY|CONDITION|MEDICATION, rawText,
sourceCollection, sourceId, sourceField, sourceDate, importedAt, importBatchId,
reviewState: PENDING|PROMOTED|DISMISSED, reviewedByUserId?, reviewedAt?,
promotedAlertId?, dismissedReason?}`

Append-only. A review promotes a candidate to a real `PatientAlert` (with a
clinician-set severity) or dismisses it with a reason; both are audited and
neither mutates `rawText`. See [20](20-migration-strategy.md).

### `IdempotencyKey` — NEW

Protects against a **retransmitted request**, which transaction retries do not
cover — a receptionist double-clicking "Take payment", or a mobile client
retrying a booking after a timeout, produces two distinct HTTP requests and two
successful transactions.

`{organizationId, key (client-supplied), route, requestHash, status: IN_FLIGHT|COMPLETED,
responseStatus?, responseBody?, createdAt, expiresAt}` with `@Unique` on
`{organizationId, key}` and a TTL index on `expiresAt`.

Applied to the mutating routes where a duplicate is materially harmful: book and
reschedule appointment, check-in, sign encounter, issue invoice, record payment,
refund, register patient. A repeat of a completed key replays the stored
response rather than re-executing. Clients supply the key in an
`Idempotency-Key` header.

### `Notification` — NEW

`{organizationId, recipientUserId, kind, title, body?, entityName?, entityId?, readAt?, actionUrl?, priority, createdAt}`
plus `NotificationPreference {userId, kind, inApp, email, sms}`. In-app only in
v1; email/SMS are flags with no transport behind them.

---

## Entity disposition summary

| Existing entity                                                                                                      | Fate                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `User`                                                                                                               | **Evolved** — soft delete, phone uniqueness dropped, org-scoped                              |
| `Role`, `Permission`                                                                                                 | Unchanged (toolkit-owned); registry gains custom actions                                     |
| `StaffProfile`                                                                                                       | **Renamed** `StaffMember`, fleshed out, `joinedAt` typed as a Date                           |
| `ClientProfile`                                                                                                      | **Renamed `Patient`**, medical identity added, sales funnel separated                        |
| `ClientMeasurement`                                                                                                  | **Split** → `Observation` (platform) + nutrition anthropometry definitions                   |
| `ClientInteraction`                                                                                                  | **Renamed** `ContactAttempt`, generalised, invariants preserved                              |
| `NutritionAssessment`                                                                                                | **Moves** to the nutrition vertical as an encounter section                                  |
| `NutritionCalculation` + `engine/`                                                                                   | **Moves** to the nutrition vertical, engine byte-identical, `Mixed` inputs/results validated |
| `ConsultationRequest`                                                                                                | **Moves** to `site-cms/leads/`, gains a workflow status                                      |
| `DoctorProfile`                                                                                                      | **Stays** in `site-cms/` as the marketing page it is. Not renamed, not retired.              |
| `SiteSettings`, `PackagesPageSettings`, `Package`, `Recipe`*, `Video`, `Review`, `FaqSection`, `FaqItem`, `Campaign` | **Stay** as CMS. `Recipe` re-homes to the nutrition vertical.                                |
| `Book`, `BookEdition`, `BookArtifact`, `BookSettings`                                                                | **Unchanged**, preserved                                                                     |

New: `Organization`, `Branch`, `Resource`, `Practitioner`,
`PractitionerAvailability`, `MrnSequence`, `PatientContact`, `PatientAlert`,
`AppointmentType`, `Appointment`, `ScheduleSlot`, `SlotCapacityOverride`,
`WaitingListEntry`,
`Encounter`, `EncounterAddendum`, `EncounterTemplate`, `Observation`,
`Diagnosis`, `Prescription`, `PrescriptionItem`, `Task`, `Service`, `Invoice`,
`InvoiceLine`, `Payment`, `Discount`, `AuditEvent`, `Document`, `Notification`,
`NotificationPreference`, `ImportedClinicalHistoryCandidate`,
`IdempotencyKey` — **32 new collections**, taking the total from 24 to
roughly 50.

**Speculative fields deliberately removed** after review: `ResourceType.BED`,
`Invoice.payerId`, `PrescriptionItem.drugId`, `Document.isPatientVisible`. Each
was cheap, and each would have added domain vocabulary a future maintainer has to
interpret with no v1 behaviour behind it. A nullable field is not free — see
[24](24-future-expansion.md).

## Index plan

Every FK gets an index (L7). The compound indexes that carry the product:

| Index                                                                      | Serves                               |
| -------------------------------------------------------------------------- | ------------------------------------ |
| `{practitionerId, startAt}` on `Appointment`                               | the calendar, and conflict detection |
| `{branchId, startAt}` on `Appointment`                                     | the branch day view                  |
| `{patientId, startedAt: -1}` on `Encounter`                                | the patient timeline                 |
| `{patientId, definitionKey, observedAt: -1}` on `Observation`              | longitudinal charts                  |
| `{patientId, occurredAt: -1}` on `AuditEvent`                              | record access history                |
| `{assignedToUserId, status, dueAt}` on `Task`                              | the worklist                         |
| `{organizationId, scopeType, scopeId, slotStart}` unique on `ScheduleSlot` | booking serialization                |
| `{organizationId, mrn}` unique on `Patient`                                | MRN lookup                           |
| `{organizationId, nextFollowUpAt}` on `Patient`                            | overdue follow-ups                   |
| `{patientId, status}` on `Invoice`                                         | outstanding balance                  |

## Prerequisites

[03](03-target-architecture.md) for placement; [06](06-organization-and-branches.md)
for `organizationId` resolution; [05](05-transactions-and-data-integrity.md) for
every multi-entity write above.

## Codex findings and resolution

Not yet consulted. The modelling decisions most worth an adversarial review:
(a) `Observation`-per-value versus a wide per-visit measurement document;
(b) rejecting a separate `FollowUp` entity in favour of three existing fields;
(c) whether `Appointment` and `Encounter` should share a status machine or stay
fully independent; (d) whether `PatientAlert` carrying both clinician-entered and
imported-history rows behind a `provenance` discriminator is right, or whether
imported history belongs in its own collection; (e) whether removing the four
speculative hook fields went too far in any case.
