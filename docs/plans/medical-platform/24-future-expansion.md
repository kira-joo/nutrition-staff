# 24 — Future expansion

**Status: APPROVED 2026-08-22 — intentionally open.** Nothing here is built. This document exists to
record what is deferred and — more importantly — the decisions taken *now* that
keep it cheap.

## Purpose

The brief is precise about the balance: *"Do not build speculative complexity
solely for hypothetical modules, but identify any foundational decisions today
that would otherwise make those extensions unnecessarily difficult later."*

This is that list.

## Deliberately deferred

| Module | Deferred because |
|---|---|
| **Admissions, wards, beds** | Inpatient care is a different product shape. A clinic and a small medical centre are outpatient. |
| **Nursing workflows** (care plans, medication administration records, shift handover) | Requires inpatient context to be meaningful. |
| **Emergency department** (triage, acuity scoring, tracking board) | A different operational tempo and a different safety bar. |
| **Laboratory** (orders, specimens, results, analyser interfaces) | Needs an order/result model and instrument integration. |
| **Radiology** (orders, modality worklists, PACS/DICOM) | Needs DICOM handling and a viewer. |
| **Pharmacy** (dispensing, stock, formulary, interaction checking) | Needs a drug database and regulatory handling. |
| **Inventory and procurement** | Needs suppliers, purchase orders, stock movements. |
| **Operating theatre** (scheduling, teams, consumables) | Needs inpatient plus inventory. |
| **Insurance and claims** (payers, policies, eligibility, claims, co-pay) | Country-specific and larger than the entire billing module. |
| **Accounting integration** | Billing stops at invoices and payments by design. |
| **Patient portal** | Patient-facing; `nutrition-client` is not disturbed. |
| **Online booking** | Depends on the portal. |
| **Telemedicine** | Video infrastructure, consent, recording. |
| **SMS / WhatsApp automation** | No transport in this release. |
| **Recurring appointment series (RRULE)** | Weekly availability plus dated exceptions covers every observed clinic pattern. |
| **Coded terminologies (ICD-10, SNOMED)** | Licensing and mapping effort disproportionate to v1 value. |
| **Paediatric growth charts and age/sex reference ranges** | Real clinical value, but needs curated reference data. |
| **Localized / RTL admin chrome** | The admin has no i18n by existing decision. |
| **Row-level SaaS tenancy** | [06](06-organization-and-branches.md). |
| **Global identity + organization memberships** | `User` is organization-bound in v1 and there is no `OrganizationMembership` join. See the note below — this is a *future SaaS design option*, deliberately not a v1 abstraction. |
| **Multi-currency** | A `Money` primitive lands; one currency per organization. |

## The hooks left in place — and the four removed

The test applied to every candidate: **does this have behaviour in v1?** If not,
it is domain vocabulary a future maintainer has to interpret with nothing behind
it, and "it's only a nullable field" is not a justification. A nullable field is
not free.

Applying that test removed four items an earlier draft had kept.

### Kept — each has present-day behaviour

| # | Hook | Also enables later | Present-day justification |
|---|---|---|---|
| 1 | **`organizationId` on every collection** | SaaS tenancy as a resolver change | Used now — every query is scoped by it |
| 2 | **`branchId` on every located record** | Ward/department scoping | Used now — multi-branch is a v1 feature |
| 3 | **`Observation` per value, with a code-declared definition registry** | Lab results are the same shape; a lab module adds definitions and a result source, not a schema | Used now — it is how vitals and anthropometry coexist |
| 4 | **`Diagnosis.code` + `codeSystem`** | Adopting ICD-10 or SNOMED becomes a data load | Used now — clinicians type codes in v1 even without a terminology behind them |
| 5 | **`Service` / `InvoiceLine` are order-shaped** | Lab and radiology orders reuse the catalogue | Not a hook — it is simply how billing is modelled |
| 6 | **`Encounter` is not `Appointment`** | Inpatient, ED and order-driven encounters attach to something that was never an outpatient appointment | Not a hook — it is the correct model, and merging them would have been unrecoverable |
| 7 | **`AuditEvent` from day one, append-only** | Every later regulated module inherits an audit trail | Used now — required for clinical and financial audit. Retrofitting audit is among the most expensive things there is |

Note that 5 and 6 are **model decisions, not hooks** — they would be the right
shape even if no future module ever arrived. Listing them as "hooks" overstated
the case, and they are reclassified here.

### Removed on review

| Removed | Was meant to enable | Why removed |
|---|---|---|
| `ResourceType.BED` | Admissions | An inpatient bed is not a schedulable outpatient resource. The enum member would have had no v1 meaning, and admissions will bring a real `Bed` concept with occupancy and transfers — at which point one enum member saved nothing. |
| `Invoice.payerId?` | Insurance | Insurance arrives with `Payer`, policies, eligibility and claims. A nullable reference to a nonexistent entity is vocabulary without behaviour. |
| `PrescriptionItem.drugId?` | A formulary | Adding a nullable reference plus a backfill later is cheaper than a field every reader has to ask about. |
| `Document.isPatientVisible` | A patient portal | No patient-facing surface exists in v1, so the flag would imply one does and would be enforced nowhere. |

The general principle, now applied rather than merely stated: **a hook must earn
its place with present-day behaviour or with a migration it demonstrably
prevents.** "Cheap" is not a reason.

Plus three mechanisms whose value is mostly future:

- **The vertical registry** ([12](12-vertical-extension-model.md)). Laboratory,
  radiology and pharmacy are all plausibly verticals rather than platform
  modules — they contribute encounter sections, observation definitions and
  worklists. The registry is designed to be the seam they arrive through.
- **The private/signed document delivery** ([08](08-platform-foundation.md)).
  Required now to close an access-control flaw; also the precondition for imaging
  and lab reports. Provider suitability stays a per-deployment question.
- **An outbox for delivery-critical events.** Not built — in-app notifications
  are created in `onCommit` and can be lost if the process dies between commit
  and callback, which is acceptable for a notification the user can also see on a
  worklist. The moment notifications become patient-facing reminders (SMS or
  WhatsApp), at-least-once delivery becomes a requirement and an outbox written
  inside the transaction is the path. Recorded so it is a known option rather
  than a rediscovery.

## What is deliberately NOT hooked

Stated so nobody adds it "just in case", and so a reviewer can see the line was
drawn on purpose:

- No `Encounter.admissionId`, no `Ward`, no `Bed` entity — and no `BED` enum
  member either.
- No order/result entities. `Service` is order-*shaped*, not an order.
- No payer, policy, or claim entities, and **no `payerId` field**.
- No drug entity, and **no reserved `drugId`**.
- No `PatientPortalUser`, and **no `isPatientVisible`**.
- No recurrence entity. Weekly availability plus dated exceptions.
- No accounting entities of any kind.
- No FHIR resource mapping layer. The naming is FHIR-*shaped* where free
  (Patient/Practitioner/Encounter/Observation/Condition), and diverges freely
  where FHIR would add cost.

The distinction is *not* "fields are cheap, entities are expensive". It is
**does this do something today?** Four nullable fields and one enum member were
removed on exactly that test, and the seven that remain all have present-day
behaviour.

## Global identity and memberships — a future SaaS option, not a v1 abstraction

Recorded here because it was considered, recommended, and then deliberately
rejected for v1 (D9 in [25](25-risks-and-open-decisions.md)).

The deployment model is **one customer = one deployment + one database + one
`Organization`**. Inside a single isolated database there is no second
organization for a membership row to point at, so an `OrganizationMembership`
join would carry exactly one row per user forever — an abstraction with no
information in it.

More importantly it would not solve the problem it was proposed for. In a future
shared-SaaS world, the practitioners and patients needing consolidation are spread
across **separate databases**. Merging them requires an explicit identity
federation and migration design — deduplicating real humans across deployments,
reconciling credentials, resolving conflicting MRNs and clinical histories. A
global `User` inside today's isolated database makes none of that easier, because
the hard part is cross-*deployment*, not cross-*organization*.

So the shape to reach for **if and when** shared tenancy is genuinely adopted:

- `User` becomes a global identity record.
- `OrganizationMembership {userId, organizationId, roles[], status}` carries
  participation, mirroring the `User` ↔ optional-profile split that is already the
  best structural decision in this codebase.
- A federation migration reconciles identities across the deployments being
  merged — and that migration, not the schema, is the actual work.

It arrives with the federation design it depends on, or not at all.

## Sequencing, if and when

A plausible order after v1, on evidence rather than guesswork: laboratory
(highest demand in outpatient clinics, and the `Observation` model already fits)
→ insurance and claims (the biggest revenue unlock in most markets) → patient
portal and online booking (reduces front-desk load, and the seams exist) →
pharmacy → inventory → inpatient (admissions, wards, nursing) → operating
theatre → emergency department.

Presented as a hypothesis to be replaced by customer evidence, not a roadmap.

## Codex findings and resolution

Not yet consulted. Ask: (a) of the seven remaining, are any still
unjustified — `Diagnosis.code`/`codeSystem` is the most arguable, since no
terminology ships; (b) was removing any of the four a mistake that will cost a
migration later; (c) is the outbox genuinely deferrable, or does the in-app
notification loss window already matter for task assignment?
