# 14 — CRM and follow-up

**Status: APPROVED 2026-08-22.** Phase 9, parallel with 8 and 10.

## Purpose

Preserve and extend what is genuinely the current product's differentiator. The
audit found this is the best-engineered part of the application; the plan is to
generalise it, not rebuild it.

## Current state

`ClientInteraction` (`src/server/interactions/**`, 10 files) is an append-only
contact timeline, and it is the best business logic in the repository:

- `CONTACT_TYPES` is a set deciding whether an entry moves
  `Patient.lastContactedAt` — a `NOTE` does not, a call does.
- A **backdating guard** stops an older contact regressing the cache.
- `nextFollowUpAt` is written through to the patient.
- `log-lifecycle-change-interaction.ts` writes a system-generated entry from
  `updateClient`.
- `update`/`delete` both throw `ForbiddenError` for `isSystemGenerated: true`, so
  the lifecycle audit trail is **untamperable**.
- **Zero nutrition coupling.** This module is already generic patient-
  communication history.

Around it: `Patient.nextFollowUpAt` with an overdue indicator, five dashboard
attention lists with a uniform "never flag on day one" grace-window rule, a
`schedule-follow-up-form`, and a `/clients/[id]/interactions` timeline screen
that the frontend audit called the one genuinely workspace-shaped screen in the
app.

Gaps: no tasks · no outcome recorded per attempt (was the patient reached?) ·
no channel · no link from an attempt to the appointment or invoice that prompted
it · consultation requests are an append-only log with **no status, no
assignment and no convert action** (there is no PUT and no DELETE on the route
at all) · no missed-appointment recovery, because there are no appointments ·
no reactivation or retention lists · deleting an interaction has **no
confirmation** (`interactions/page.tsx:565` calls `mutate` straight from
`onClick`, unlike every table delete, which uses the declarative `confirm:`).

## Target state

`ContactAttempt` (renamed and generalised from `ClientInteraction`) and `Task` —
[04](04-domain-model.md) §6. Every invariant above is preserved verbatim; the
`CONTACT_TYPES` set, the backdating guard and the `isSystemGenerated`
immutability are carried across unchanged and get the tests they lack.

Additions:

| Addition                                                                                        | Purpose                                                                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `outcome` enum (`REACHED / NO_ANSWER / WRONG_NUMBER / REFUSED / RESCHEDULED`)                   | "Called three times, never reached" is the actual CRM signal, and it is unrecordable today             |
| `channel` enum                                                                                  | Phone, WhatsApp, SMS, email, in-person — reporting needs it                                            |
| `relatedAppointmentId`, `relatedInvoiceId`                                                      | Ties an attempt to its cause                                                                           |
| New types: `APPOINTMENT_REMINDER`, `NO_SHOW_FOLLOW_UP`, `PAYMENT_REMINDER`, `PRESCRIPTION_SENT` | The appointment and billing modules generate these                                                     |
| `Task`                                                                                          | Assignable, due-dated work. Indexed `{assignedToUserId, status, dueAt}` — that index _is_ the worklist |

**`FollowUp` is deliberately not an entity.** `Patient.nextFollowUpAt` +
`Encounter.followUpAt` + `Task` cover every case in the brief. A fourth
overlapping concept would be exactly the speculative structure the brief
forbids. Recorded as an explicit rejection so it is not silently reintroduced.

### Missed-appointment recovery

The capability the brief names and the app cannot have today. When an
appointment moves to `NO_SHOW`:

1. A `Task` is created for the patient's assigned staff member, due per the
   organization's configured recovery window.
2. A system-generated `ContactAttempt` of type `NO_SHOW_FOLLOW_UP` records the
   event.
3. The patient appears on a "recovery" worklist until contacted or explicitly
   dismissed with a reason.

All inside the no-show transition's transaction, so a no-show never silently
fails to generate its recovery.

### Retention and reactivation

Query-driven lists, no new entities:

- **Overdue follow-ups** — `nextFollowUpAt < now`, already exists, kept.
- **Lapsed** — no encounter in N days while `clinicalStatus = ACTIVE`.
- **Never returned** — exactly one encounter, more than N days ago.
- **Uncontacted leads** — `crmLifecycle = LEAD`, no contact attempt.
- **Recovery** — the no-show list above.
- **Outstanding balance** — from [15](15-billing-and-payments.md).

Every threshold comes from `Organization.settings`, not a constant. The existing
`dashboard.constants.ts` centralises ten thresholds each with a rationale
comment — that discipline is kept, the values move to data.

Marketing-consent withdrawal excludes a patient from every one of these lists.
That is a legal requirement, not a preference, and it gets a test.

### Consultation requests become a real inbox

`site-cms/leads/` gains a workflow: `NEW → ASSIGNED → CONTACTED → CONVERTED | REJECTED | SPAM`,
an `assignedToUserId`, and a **convert action** that calls the platform's
`registerPatient` use case. Today the detail page's only action is "View client
profile", which is not triage.

The security posture is untouched: honeypot, minimum-submit-time, per-IP rate
limit, and **always** `{success: true}` on the public endpoint so an
unauthenticated caller can never learn whether a phone number exists in the CRM.
That is deliberate and stays.

## Screens

`/worklist` — the assigned user's tasks and follow-ups, the CRM home.
`/patients/[id]/crm` — attempts timeline, tasks, lifecycle, source, consent.
`/leads` — the triage inbox with assignment and convert.
`/reports/retention` — the lists above.
Logging an attempt and scheduling a follow-up are **drawers**, not pages.

## Validation and business rules

Backdating guard preserved · `isSystemGenerated` rows immutable · a `NOTE` never
moves `lastContactedAt` · a follow-up date cannot be in the past · a task cannot
be assigned to an inactive user · closing a task requires an outcome when it came
from a recovery · deleting an attempt now requires confirmation (the missing
`confirm:`).

## Audit and events

Every attempt and task write is audited. Task assignment notifies the assignee
(`onCommit`). Lifecycle changes continue to write their system-generated,
untamperable entry.

## Edge cases

An attempt logged for a merged patient (re-points to the winner) · a task whose
assignee leaves (reassigned to the branch queue, never orphaned) · a follow-up
set on a `DECEASED` patient (blocked with a clear message) · an attempt backdated
before the patient's registration (allowed — a clinic logs a pre-registration
call) · a lead converting to a patient who already exists (the duplicate-warning
path from [09](09-patients.md), not a 409).

## Testing strategy

`CONTACT_TYPES` membership drives `lastContactedAt` exactly as today · the
backdating guard, tested (untested today) · `isSystemGenerated` immutability,
tested (untested today) · a no-show generates exactly one task and one attempt,
atomically, and generates none on rollback · every retention list respects
consent withdrawal · lead conversion is transactional.

## Acceptance criteria

- [ ] Every existing `ClientInteraction` invariant preserved and now tested.
- [ ] Contact outcome and channel are recorded and reportable.
- [ ] A no-show automatically produces recovery work.
- [ ] Leads can be assigned, triaged and converted.
- [ ] Consent withdrawal removes a patient from all outreach lists.
- [ ] Deleting an attempt requires confirmation.

## Codex findings and resolution

Not yet consulted. Ask whether rejecting a `FollowUp` entity holds up once tasks,
`Patient.nextFollowUpAt` and `Encounter.followUpAt` all coexist — or whether
three overlapping fields is worse than one entity.
