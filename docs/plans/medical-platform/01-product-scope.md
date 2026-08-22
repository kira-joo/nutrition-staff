# 01 — Product scope and goals

**Status: APPROVED 2026-08-22.**

## Purpose

Fix the boundary of the first sellable release, and record what is deliberately
excluded, so no later phase has to re-litigate scope mid-implementation.

## What is being built

A **Medical Clinic / Medical Center Management Platform**: the operational
system a private clinic, a multi-doctor practice, or a small-to-medium medical
centre runs its day on. Not a hospital ERP. Not an EMR standard implementation.
Not a patient-facing product.

The product is sold as a deployment: one application, one database, one
`Organization`, per customer. Multi-branch is in scope from day one because a
"medical centre" with two locations is a normal customer, not an enterprise
edge case.

## What "sellable" changes about the current app

`nutrition-staff` today is one clinic's back office. Three things make it
un-sellable as-is, and all three are structural rather than cosmetic:

| Blocker | Evidence | Addressed in |
|---|---|---|
| The domain is a nutrition sales funnel, not a medical record. The patient entity is `ClientProfile` with a required `lifecycle` of `lead/prospect/active/paused/completed/lost` and no MRN, no allergies, no emergency contact, no encounter. | `src/server/clients/client-profile.schema.ts` | [04](04-domain-model.md), [09](09-patients.md), [11](11-encounters-clinical-records.md) |
| More than half the code is one customer's public website. Books (~90 backend files), campaigns (~30 files), recipes/videos/reviews/faq/packages/site-settings/doctor-profile. | measured across `src/server/**` | [03](03-target-architecture.md), [23](23-site-cms-and-books-disposition.md) |
| Only a `grantsAll` admin can use the application at all. The four seeded roles are `admin` (grantsAll), `hr` (5 User/Role keys), `manager` (4 keys), and `employee` (**zero permissions**). Not one of the 135 generated permission keys covering patients, measurements, assessments, calculations, interactions or the dashboard is granted to any non-admin role. | `scripts/seed-roles-and-permissions.ts:14-35`; `scripts/qa/grant-admin-role.ts` exists precisely because of this | [07](07-authorization-roles-permissions.md) |

## In scope for the first release

### Platform foundation
Organization settings · branches/facilities · rooms and schedulable resources ·
users, staff, and **practitioners** as a real entity · roles and granular
permissions including resource scoping · an append-only audit/activity stream ·
documents and files with private delivery · notifications and notification
preferences · global search and a command palette · role-aware navigation.

### Patients
Identity separate from clinical record · a per-organization medical record
number · contact information that tolerates a shared family phone ·
emergency contacts · tags, source, CRM lifecycle **and** a separate clinical
status · assigned clinician and assigned staff · medical alerts and allergies as
current patient-level state (not buried in a point-in-time assessment) ·
documents · notes · appointments · encounters · billing and balance · follow-up ·
one unified chronological timeline.

### Appointments and scheduling
Month/week/day calendar · multi-practitioner resource lanes · practitioner
availability and exceptions · appointment types with default durations ·
branch/room/resource assignment · booking, rescheduling, cancellation ·
walk-ins with no prior appointment · no-shows · check-in and a waiting board ·
conflict detection · usable by a receptionist for six doctors at once.

### Encounters and medical records
An `Encounter` that is **not** an appointment. Visit reason and complaint ·
vitals and observations · clinical notes · diagnosis · basic prescription and
medication instructions · attachments · follow-up instructions and date ·
configurable specialty forms and templates. Draft → signed lifecycle, with
signed encounters immutable and amended by addendum.

### CRM and follow-up
This is the current app's genuine differentiator and it survives intact.
Next follow-up · overdue follow-ups · contact attempts · notes · tasks ·
source and referral · lifecycle and status · missed-appointment recovery ·
communication history · retention and reactivation lists.

### Billing and payments
Practical, not accounting-grade. Service catalog with prices · invoices and
receipts · payments and payment methods · discounts · outstanding balances ·
packages/sessions where a service is sold as a block.

### Dashboards and reporting
Role-relevant and actionable, never decorative. Today's appointments · waiting
and checked-in · follow-ups due · unpaid balances · new patients · recent
activity · revenue summaries · practitioner workload.

### The nutrition vertical
Every existing capability preserved: nutrition assessments, anthropometric
measurement, the 10-file calculation engine with its versioned formulas and
safety floors, and the nutrition follow-up workflow — re-homed as a vertical
behind the platform's encounter model rather than as the product's core.

## Explicitly out of scope for the first release

| Excluded | Why, and what is left in place for it |
|---|---|
| Full financial accounting, ledgers, tax reporting | Billing stops at invoices, payments, discounts and balances. `Service`/`Invoice`/`InvoiceLine` are shaped so an accounting integration can read them later. |
| Insurance and claims | No payer, policy, eligibility, or claim entities, and no nullable `payerId` seam either — it was removed on review as vocabulary without behaviour. See [24](24-future-expansion.md). |
| Hospital modules: admissions, wards, beds, nursing, ED, laboratory, radiology, pharmacy, inventory, operating theatre | See [24](24-future-expansion.md) for the six foundational decisions taken now that keep these cheap. |
| Patient portal, online booking, telemedicine | The brief permits considering them architecturally. They are considered — `Appointment` and `Document` are modelled so a portal reads them — and not built. `nutrition-client` is not disturbed. |
| Row-level SaaS multi-tenancy | `organizationId` lands on every schema now precisely so this is later a resolver change. See [06](06-organization-and-branches.md). |
| Multi-currency | A `Money` primitive with minor units and a currency code lands in `toolkit-common`; the app still runs one currency per organization. Today's `Currency` enum has exactly one member. |
| Localized admin chrome / RTL admin UI | The admin app has no i18n and no locale routing, by existing decision. A sellable product will eventually need it; [17](17-ux-architecture-and-design-system.md) records the constraints so nothing is built that blocks it. |
| Redesigning the Books UI | Preserved successful experience. See [23](23-site-cms-and-books-disposition.md). |
| Any change to `nutrition-client` | Beyond the four frozen contract surfaces, untouched. |
| HL7 / FHIR / ICD-10 coded terminologies | `Diagnosis` carries an optional `code` + `codeSystem` pair so a terminology can be adopted without a migration. No terminology is shipped. |

## Non-goals worth stating out loud

- **Not a standards-compliant EMR.** No FHIR resources, no CDA, no
  interoperability certification. The data model is FHIR-*shaped* where that
  costs nothing (Patient/Practitioner/Encounter/Observation/Condition naming)
  and diverges freely where FHIR would add cost with no customer benefit.
- **Not a generic admin panel generator.** The brief forbids "sidebar + tables +
  forms everywhere", and the audit found the current app is exactly that: 40 of
  81 pages are interchangeable CRUD scaffolds. See
  [17](17-ux-architecture-and-design-system.md).
- **Not a rewrite.** Nothing working is deleted to make something generic.

## Success criteria for the first release

1. A receptionist can run a full clinic day — book, reschedule, check in, manage
   a waiting room for multiple doctors, take a payment — without leaving the
   scheduling and patient surfaces.
2. A doctor can open their worklist, complete an encounter with vitals,
   diagnosis, prescription and follow-up, and sign it, without seeing a single
   CRM or CMS screen.
3. A clinic owner can see revenue, workload, follow-up compliance and unpaid
   balances for the whole organization, scoped by branch.
4. A second specialty (used as the proof, not shipped) can be added as a
   vertical without editing any file under `platform/`.
5. Nutrition loses nothing: every assessment field, every formula, every
   assumption string, every safety floor still works, and now has tests it never
   had.
6. The public website continues to work with zero changes to `nutrition-client`.

## Prerequisites

None — this document is the scope input to every other one.

## Downstream dependencies

Every other document in this directory.

## Codex findings and resolution

Not yet consulted. The scope question to put to Codex: is billing genuinely
first-release, or does shipping patients + scheduling + encounters + CRM as v1
and billing as v1.1 produce a sellable product sooner? The brief says billing is
in the first major scope; the counter-argument is that Phase 10 depends on both
Phase 5 and Phase 6 and is the most deferrable slice with a clean seam.
