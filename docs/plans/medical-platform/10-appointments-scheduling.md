# 10 — Appointments and scheduling

**Status: APPROVED 2026-08-22.** Phase 6. The largest greenfield
surface in the programme.

## Purpose

Give a receptionist a tool they can run a clinic day on, for several
practitioners at once, across branches and rooms.

## Current state

**Nothing exists.** No appointment entity, no calendar, no availability, no
check-in, no waiting board. The word "appointment" appears in the codebase only
in the brief and in `ClientInteraction`'s type enum as a candidate value.

The toolkit has no calendar view of any kind: `CustomDatePicker` is a native
`<input type="date">` (or `datetime-local` when `includeTime`), timezone-correct
but a single-value input. There is no date-range picker, no calendar popover, no
month/week/day grid, no timeslot picker, no availability grid, no recurrence, and
no duration/interval/overlap math anywhere — `toolkit-common`'s 13 datetime
functions are calendar-boundary math only. This is confirmed as the single
biggest toolkit gap.

What does exist and helps: DST-correct zone helpers
(`startOfDayInZone`, `startOfWeekInZone` (Monday), `addDaysInZone`,
`zonedComponentsToUtcInstant`), a `DateTimeConfig.timeZone` app default, and a
date picker that already round-trips real UTC instants through a configured zone.

## Target state

Entities: `AppointmentType`, `Appointment`, `PractitionerAvailability`,
`WaitingListEntry`, `Resource`, `ScheduleSlot`, `SlotCapacityOverride` —
[04](04-domain-model.md) §4.

### Time handling — decided up front because it is the classic failure

- `Appointment.startAt`/`endAt` are **UTC instants**.
- `PractitionerAvailability.startTime`/`endTime` are **wall-clock `"HH:mm"`
  strings** in the branch timezone. A recurring 09:00 clinic must stay 09:00
  across a DST change; storing it as a UTC instant silently shifts it.
- Slot generation converts wall-clock availability to instants **per date**, in
  the branch timezone, using `zonedComponentsToUtcInstant`. This is where DST is
  handled once, correctly, rather than in five places.
- Display always converts back through the branch timezone, not the browser's.
- `Branch.timezone` overrides `Organization.timezone`.

### Availability and slot resolution

`GET /api/appointments/availability?practitionerId=&branchId=&from=&to=&appointmentTypeId=`
returns free slots. Server-side composition, per the workspace convention that
the backend owns business logic:

1. Expand recurring weekly availability across the range.
2. Subtract `EXCEPTION_UNAVAILABLE`; add `EXCEPTION_AVAILABLE`.
3. Intersect with `Branch.openingHours`.
4. Subtract existing non-terminal appointments for the practitioner.
5. Subtract resource conflicts when the appointment type requires a resource.
6. Slice into slots of `appointmentType.defaultDurationMinutes` (or the
   practitioner's default).
7. Drop slots in the past.

Never computed on the client. A client computing availability is how
double-bookings happen.

### Booking, conflicts, and serialization

The conflict rule: no two non-terminal appointments may overlap
`[startAt, endAt)` for the same practitioner, and likewise for the same
resource.

**A transaction alone does not enforce this, and an earlier draft of this plan
was wrong to imply it did.** MongoDB transactions give snapshot isolation, not
serializability. Two concurrent bookings each read "no overlapping appointment"
from their own snapshot and then **insert two different documents**. Different
documents means no write-write conflict, so nothing serializes them and both
commit. The overlap check becomes a read that proves nothing.

A unique index cannot express interval overlap either. So the invariant needs an
explicit serialization point.

#### The mechanism: pre-materialized fixed-bucket slot claims

**This design was rewritten after Codex review.** The first version used a
per-practitioner-per-day `ScheduleOccupancy` document that every booking
`$inc`-ed to force a write conflict. Codex found three defects that killed it,
and all three were verified against the code:

1. The repository has **no `upsert`**. `updateImpl` forwards only `session` to
   `executeUpdate`, which calls `findOneAndUpdate` with no upsert option
   (`backend-toolkit-mongoose/src/repository/create-mongoose-repository.ts:278`,
   `write/execute-update.ts:36`). The pseudocode depended on an API that does
   not exist.
2. Worse, the first-use upsert was the load-bearing step. Two concurrent
   upserts of the same unique key can race to **insert**, and the loser gets
   `E11000` — not a `TransientTransactionError`. From MongoDB 8.1 an upsert that
   hits a duplicate key inside a transaction is **not** automatically retried.
   So the very first booking of a practitioner-day, the case with no existing
   document, was the case the mechanism handled worst.
3. Per-day granularity is not "one rare retry". Every booking for a busy
   practitioner on a day contends. A clinic entering 100 appointments for one
   doctor serializes all 100 transactions, and with a bounded retry budget a
   burst produces **false 409s on non-overlapping slots** — the worst possible
   failure, because it rejects valid work.

The corrected design removes the race by never creating the lock document on the
hot path, and removes the contention by making the lock granular.

**`ScheduleSlot` — pre-materialized, one row per bookable bucket:**

```
ScheduleSlot {
  organizationId  ref, req
  scopeType       "PRACTITIONER" | "RESOURCE"
  scopeId         ObjectId
  slotStart       Date          // exact bucket boundary, UTC instant
  capacity        number, default 1
  consumed        number, default 0
  appointmentIds  ObjectId[]    // what consumed it, for diagnosis
}
@Unique on { organizationId, scopeType, scopeId, slotStart }
```

`SLOT_MINUTES` is an **organization setting, never a domain constant**. A default
is chosen (5), but the default is the least interesting part of the decision —
what matters is the documented behaviour when it changes while materialized slots
and live bookings already exist. Every `AppointmentType` duration must be a
multiple of the current value, validated at type creation, so the grid question is
settled by configuration rather than at booking time.

#### Changing `SLOT_MINUTES` — the versioning and re-materialization rule

A change is a **migration, not a settings edit**, and the setting is not directly
writable once slots exist.

`ScheduleSlot` carries `slotMinutes` alongside `slotStart`, so every materialized
row records the grid it was created on. That is what makes a change tractable
rather than corrupting.

| Situation                                                        | Rule                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No materialized slots exist                                      | The setting is freely editable.                                                                                                                                                                                                                                                                                                                                                                                    |
| Slots exist, none consumed                                       | Re-materialize: delete unconsumed slots on the old grid, materialize the horizon on the new one. Single transaction per practitioner-day.                                                                                                                                                                                                                                                                          |
| Slots exist and some are consumed                                | The change applies **from a cutover instant only** — by default the start of the next day beyond the last existing booking. Slots before the cutover keep their old `slotMinutes` and are never rewritten; slots after it are re-materialized on the new grid. Existing bookings are never re-bucketed, because re-bucketing a claimed interval cannot be done without either dropping a claim or fabricating one. |
| An appointment straddles the cutover                             | Rejected at validation. The cutover is chosen at a day boundary precisely so this is rare, and refusing is better than splitting a claim across two grids.                                                                                                                                                                                                                                                         |
| An `AppointmentType` duration is not a multiple of the new value | The migration **fails and reports** before touching anything. Durations are reconciled first, as an explicit product decision, never silently rounded.                                                                                                                                                                                                                                                             |

Two consequences stated plainly: `bucketsFor(appointment)` must read
`slotMinutes` from the slots it is claiming rather than from the current setting,
and the release rule holds — releasing a cancelled appointment always uses the
grid recorded on the slots it actually claimed. A booking never mixes grids.

Narrowing the grid (10 → 5) is cheap; widening it (5 → 10) is the case that can
strand a claimed interval, and the cutover rule is what prevents that.

**Booking claims every bucket the interval covers, in one transaction:**

```
withTransaction(async (tx) => {
  const slots = bucketsFor(appointment);          // [startAt, endAt) / SLOT_MINUTES
  for (const scope of scopesFor(appointment)) {   // practitioner, then resource
    for (const slotStart of slots) {              // ascending
      const claimed = await scheduleSlotRepository.claim(
        { organizationId, scopeType: scope.type, scopeId: scope.id, slotStart },
        appointment._id
      );
      if (!claimed) throw new ConflictError(...);  // capacity exhausted
    }
  }
  await appointmentRepository.save(appointment);
  return tx.complete(appointment);
});
```

`claim` is a single conditional atomic update —
`findOneAndUpdate({...key, consumed: {$lt: capacity}}, {$inc: {consumed: 1}, $push: {appointmentIds}})`
— returning `null` when the slot is full. Two properties follow, and they are
what make the invariant provable:

- **Competing bookings write the same slot document**, so one is serialized by a
  genuine write conflict, and the other is rejected by the `consumed < capacity`
  guard. Both outcomes are correct; neither depends on a read.
- **No upsert on the hot path**, so the `E11000` race disappears entirely.

**Buckets are pre-materialized, not created on demand.** A scheduled job (and an
availability-write hook) materializes slots for the published scheduling horizon
— default 90 days — from `PractitionerAvailability` ∩ `Branch.openingHours`.
Materialization is idempotent and upserts happen **outside** any booking
transaction, where an `E11000` is simply "already exists" rather than a lost
booking. A booking for an instant with no slot row is not a conflict, it is
_outside published availability_, and returns a distinct 422 — which is more
correct than the old design's answer, because it distinguishes "already taken"
from "never bookable".

**Contention is now per-bucket.** Two bookings for the same practitioner at
different times touch disjoint documents and never contend. Only genuine overlap
contends, which is exactly the invariant.

#### Details that make it correct

- **Both scopes claimed in one transaction**, practitioner first then resource,
  and within each scope buckets ascending. Deterministic global order
  `(scopeType, scopeId, slotStart)` — the fix for a retry storm when two
  transactions touch a practitioner and a resource in opposite orders.
- **Sequential, never `Promise.all`.** A single Mongoose session cannot safely
  run parallel operations; the loop is deliberately serial
  ([05](05-transactions-and-data-integrity.md)).
- **Release on cancel / no-show / reschedule** decrements `consumed` and pulls
  the appointment id, in the same transaction as the status change. Reschedule
  releases the old buckets and claims the new ones atomically.
- **`slotStart` is a UTC instant** on an exact bucket boundary; materialization
  converts wall-clock availability through the branch timezone, so DST is
  handled once, at materialization, and never at booking.
- **Cross-midnight appointments** simply span buckets. No special case — the old
  design's "bumps two date documents" wart is gone.
- **Retention.** Slots are small and bounded by the horizon; a monthly job drops
  slot rows older than the audit window.

#### Rejected alternatives

| Alternative                                                        | Why not                                                                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Overlap query inside a transaction, nothing else                   | **Does not work.** Snapshot isolation does not serialize inserts of distinct documents. The original flaw.                                                                                             |
| Per-practitioner-per-day version document                          | **Rejected after review** — depends on a nonexistent `upsert`, races on first use with a non-retryable `E11000`, and serializes every booking for a busy practitioner-day into false 409s under burst. |
| `findOneAndUpdate` on the appointments collection as a pseudo-lock | Nothing exists to lock before the first booking, and a sentinel pollutes the collection.                                                                                                               |
| An in-process mutex                                                | The existing rate limiter's own comment says a process-local `Map` must be replaced if the deploy becomes multi-instance — and a Vercel-shaped deployment is multi-instance by default.                |
| A distributed lock (Redis)                                         | New infrastructure for something MongoDB can serialize.                                                                                                                                                |
| `readConcern: "snapshot"` / `writeConcern` tuning                  | Neither turns snapshot isolation into serializability for distinct-document inserts.                                                                                                                   |
| Arbitrary-precision interval reservations inside one document      | Needed only if sub-bucket durations are genuinely required. `SLOT_MINUTES` as a setting covers every clinic pattern in the brief; recorded as the escape hatch.                                        |

#### Overbooking

Overbooking is **capacity, not a boolean bypass** — Codex was right that a flag
that skips the check leaves later ordinary bookings unable to distinguish an
intentional double-booking from a forbidden one.

An override raises the affected slots' `capacity` by one, recorded as a
`SlotCapacityOverride {slotIds[], grantedByUserId, reason, appointmentId}` row,
and requires the custom `Appointment.overbook` permission. The claim path is
then **identical** for every booking: `consumed < capacity`. So the invariant
never has an exception — only the capacity varies, and every variation has an
audited reason and an author.

Clinics do overbook; pretending otherwise means they work around the software.
Modelling it as capacity means the schedule stays queryable ("which slots are
over capacity, and who authorised that?") instead of carrying an invisible flag.

### Status machine

`SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`, plus
`SCHEDULED|CONFIRMED → CANCELLED`, `→ NO_SHOW` (only after `endAt` has passed),
`→ RESCHEDULED` (terminal; a new row carries
`rescheduledFromAppointmentId`, so history is a chain rather than a mutation).
A walk-in is created directly at `CHECKED_IN`.

Every transition is validated as a transition, audited, and rejected with a 409
rather than silently applied. `NO_SHOW` optionally creates a recovery task —
[14](14-crm-and-followup.md).

### Check-in and the waiting board

Check-in is one action that does three things transactionally: moves the
appointment to `CHECKED_IN`, creates the `Encounter` in `DRAFT`, and creates the
`WaitingListEntry`. That is [05](05-transactions-and-data-integrity.md)
workflow 6, and an orphaned encounter with no appointment state change is a
patient standing in a waiting room the system cannot see.

The board shows, per practitioner: waiting (with wait duration, escalating in
severity), with-practitioner, and done. It is the highest-frequency screen in a
clinic and gets the most design attention of any surface in
[17](17-ux-architecture-and-design-system.md) after the patient banner.

## Screens

- `/schedule` — the calendar. Day (default, multi-practitioner resource lanes),
  Week (one practitioner, or one branch), Month (density overview only).
- `/schedule/board` — the waiting/check-in board.
- Booking as a **drawer** from anywhere: patient record, calendar slot, waiting
  board, or ⌘K. Never a page navigation — this is the flow that most justifies
  `drawerPresentation`.
- `/settings/appointment-types`, `/settings/resources`,
  `/practitioners/:id/availability`.

### The calendar UI — the generic/local boundary

**Decision reversed after review: the calendar is built app-local, after a
library bake-off. No calendar component ships in a shared package.**

The earlier plan put a generic `CalendarView` in `frontend-toolkit-tailwind`,
justified on RTL and the `--ftk-*` token contract. Both halves were wrong:
FullCalendar, React Big Calendar, DayPilot, Mobiscroll and Schedule-X all support
RTL, and CSS variables can theme a third-party component through a wrapper. It is
also not a primitive — day/week/month, resource lanes, drag and drop, overlap
columns, minimum event height, cross-midnight and all-day events, DST
discontinuities, virtualization, pointer capture, auto-scroll while dragging,
keyboard drag alternatives, screen-reader announcements, locale week starts and
print are a product, and the first draft named perhaps a third of them.

So, in order:

1. **A bake-off opens Phase 6**, before any scheduling UI is written:
   FullCalendar (Scheduler, if the licence is acceptable), Schedule-X, React Big
   Calendar plus a resource view, and DayPilot Lite — against explicit fixtures
   for Arabic/RTL, a DST transition day, 6+ practitioner lanes, 375px, and
   keyboard/screen-reader operation.
2. **The scheduling UI is built in `platform/appointments/`** either way: a themed
   adapter around the winner, or — only if every candidate genuinely fails the
   fixtures — a bespoke view scoped honestly rather than optimistically.
3. **Toolkit extraction is deferred** to a real second consumer or a stable
   interface proven by use, per `.claude/skills/toolkit-first-development/SKILL.md`.

What stays app-local regardless: availability computation, the slot-claim
serialization, conflict rules, the status machine, the waiting board, and every
appointment-shaped visual.

Deliberately **not** built: recurring appointment series, drag-to-resize on
touch, and printing a schedule.

### Responsive degradation

- 1440: day view with up to 6 practitioner lanes, or a full week.
- 768: day view, 2–3 lanes, horizontally scrollable within its own container —
  never the page.
- 375: a single-practitioner **agenda list**, not a grid. A time grid at 375px is
  unusable; the honest answer is a different view, not a squeezed one. Practitioner
  selection moves to a segmented control.

## APIs

`GET /api/appointments?from=&to=&practitionerId=&branchId=&status=` ·
`POST /api/appointments` · `GET/PUT /api/appointments/:id` ·
`POST /api/appointments/:id/confirm|check-in|start|complete|cancel|no-show` ·
`POST /api/appointments/:id/reschedule` ·
`GET /api/appointments/availability` ·
`GET /api/waiting-list?branchId=` · `PUT /api/waiting-list/:id/state` ·
`GET/POST /api/appointment-types` · `GET/PUT/DELETE /api/appointment-types/:id` ·
`GET/POST /api/practitioners/:id/availability` ·
`GET/POST /api/resources`.

Action endpoints rather than a raw status PUT, because each transition has its
own guards, side effects and audit action. A generic status PUT would make every
one of them optional.

**Booking, rescheduling and check-in require an `Idempotency-Key`**
([04](04-domain-model.md) §8). The slot-claim mechanism serializes _concurrent_
requests; it does nothing about a _retransmitted_ one — a receptionist
double-clicking "Book" or a client retrying after a timeout is two distinct HTTP
requests, each of which would legitimately claim its own slots. A replayed key
returns the stored response instead of re-executing.

## Validation and business rules

`endAt > startAt` · duration within the type's bounds · the practitioner must be
active and assigned to the branch · a `DECEASED` patient cannot be booked · no
booking in the past without `Appointment.overbook` · cancellation within the
org's notice window is flagged as late · `NO_SHOW` only after `endAt` · a
resource cannot exceed its capacity.

## Search, filter, sort

By practitioner, branch, status, appointment type, date range, and patient.
The date-range and multi-select table filters do not exist in the toolkit today
(`FilterConfig` supports only `SELECT` and `COMBOBOX`) and are part of release
wave A-frontend — [19](19-toolkit-and-package-changes.md).

## Notifications and events

Booked/rescheduled/cancelled → notify the practitioner. Checked in → notify the
practitioner. All as `onCommit` callbacks. Patient-facing reminders are **not**
built: `remindersSentAt` exists as the seam, and there is no SMS or WhatsApp
transport in this release. Stated explicitly so nobody assumes reminders send.

## Edge cases

DST boundary days (a 09:00 recurring slot on the changeover date is the required
test) · a practitioner removed from a branch with future appointments (existing
ones stand, new ones blocked) · availability edited under existing bookings
(bookings stand, conflicts surfaced as a warning list, never auto-cancelled) ·
a walk-in when the practitioner is fully booked (allowed onto the waiting list,
which is what a real clinic does) · a patient with two appointments the same day
(allowed) · a cancelled appointment whose encounter was already started (the
encounter survives; cancelling is blocked once `IN_PROGRESS`).

## Testing strategy

Slot generation across a DST change · overlap detection at exact boundaries
(`endAt === startAt` must **not** conflict) · every illegal status transition
rejected · check-in atomicity: forced failure leaves no encounter and no waiting
entry · timezone correctness with a branch timezone differing from the
organization's · calendar DOM geometry measured at 375/768/1440 with no
page-level horizontal overflow.

### Concurrency tests — these prove the invariant and are blocking for the phase

Run against `MongoMemoryReplSet`, the harness already proven in
`backend-toolkit-mongoose`'s own tests
(`create-mongoose-repository.test.ts:606`).

1. **The decisive test.** Two `Promise.all` bookings for the _same_ practitioner
   and an _exactly overlapping_ interval: exactly one commits, one 409s, exactly
   one appointment exists, and the claimed slots' `consumed` equals 1. Repeated
   ~50 times, because a timing-dependent bug passes once.
2. Same, for two **partially** overlapping intervals — asserts the shared
   buckets are the contention point.
3. Same, for two bookings sharing a **resource** but different practitioners.
4. Two concurrent **non-overlapping** bookings for the same practitioner-day
   both succeed **with zero retries** — the regression guard against the
   per-day-contention pathology the first design had.
5. Back-to-back appointments (`09:00–09:30` and `09:30–10:00`) both succeed —
   the half-open-interval boundary test.
6. Concurrent **book vs. cancel** of the same slot: no lost update; `consumed`
   is never negative and never double-counted.
7. Concurrent **reschedule** into the same target slot: exactly one wins, and
   the loser's original slots are still claimed (no partial release).
8. Two concurrent bookings against a slot whose `capacity` was raised to 2:
   **both** commit — proving the override works through capacity, not through a
   bypass.
9. A booking for an instant with **no materialized slot** returns 422
   ("outside published availability"), distinctly from 409.
10. Slot materialization is idempotent: run twice, no duplicates, no
    `E11000` escaping to the caller.
11. Materialization concurrent with booking does not produce a lost booking.
12. Retry accounting: on a forced write conflict the loser's `fn` re-runs,
    retries are bounded, and **exhaustion surfaces as 503**, not 409.
13. Slot claims are acquired in the deterministic global order, asserted by
    instrumenting the write sequence.
14. **The negative control.** With the `consumed < capacity` guard deliberately
    removed, test 1 must **fail**.

Tests 4, 9 and 14 matter as much as test 1: 4 proves the contention fix, 9 proves
the two failure modes are distinguishable, and 14 proves the mechanism is what
provides the guarantee rather than the test passing incidentally.

## Acceptance criteria

- [ ] A receptionist can book, reschedule, cancel, check in and mark no-show for
      six practitioners in a day view without leaving the screen.
- [ ] Concurrent double-booking is impossible, proven by the 14 concurrency
      tests — including the negative control.
- [ ] Two non-overlapping bookings for the same practitioner-day never contend.
- [ ] Resource conflicts are serialized, not only practitioner conflicts.
- [ ] Overbooking is capacity with an audited override record, not a bypass flag.
- [ ] "Outside published availability" (422) and "already taken" (409) are
      distinguishable, and exhausted infrastructure retries return 503.
- [ ] No `upsert` occurs inside a booking transaction.
- [ ] Slot generation is correct across a DST transition.
- [ ] 375px gives a usable agenda view, verified by DOM measurement.
- [ ] The waiting board reflects state changes within one refresh cycle and
      shows wait duration.
- [ ] The bake-off ran against the five named fixtures and its result is recorded
      before any scheduling UI was written.
- [ ] No calendar component was added to a shared package.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict on the original design: FATALLY FLAWED. Rewritten.**

| #   | Finding                                                                                                                                                                                                         | Severity | Analysis                                                                                                                                                                                  | Resolution                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | The pseudocode called `repository.update(..., {$inc})` with "upsert on first use", but the repository has no `upsert` option — `updateImpl` forwards only `session` to a plain `findOneAndUpdate`.              | CRITICAL | **Verified** in `create-mongoose-repository.ts:278` and `write/execute-update.ts:36`. Correct; the design depended on an API that does not exist.                                         | **Accepted.** Design rewritten around pre-materialized slots and a conditional `claim`, so no upsert occurs on the booking path at all.                                              |
| 2   | Concurrent _first-use_ upserts race to insert the same unique key and produce `E11000`, not `TransientTransactionError` — and from MongoDB 8.1 a duplicate-key upsert inside a transaction is not auto-retried. | CRITICAL | Correct, and it was the worst case: the very first booking of a practitioner-day was the one the mechanism handled least well.                                                            | **Accepted.** Materialization moved off the hot path entirely and made idempotent outside any booking transaction.                                                                   |
| 3   | Converting every exhausted transient retry into a 409 is semantically false — primary elections and timeouts are not appointment conflicts.                                                                     | MAJOR    | Correct.                                                                                                                                                                                  | **Accepted.** Exhausted infrastructure retries return **503**; 409 only after a successful retry finds a real conflict. Also amended in [05](05-transactions-and-data-integrity.md). |
| 4   | Per-day locking is pathological: 100 bookings for one practitioner serialize, and a bounded retry budget turns a burst into false 409s on non-overlapping slots.                                                | MAJOR    | Correct, and more serious than the doc's "negligible, one retry" claim. Rejecting valid work is the worst failure mode available.                                                         | **Accepted.** Granularity moved to fixed `SLOT_MINUTES` buckets; non-overlapping bookings now touch disjoint documents.                                                              |
| 5   | `allowOverlap` as a boolean weakens the invariant globally — later bookings cannot distinguish an intentional overlap from a forbidden one.                                                                     | MAJOR    | Correct.                                                                                                                                                                                  | **Accepted.** Overbooking is now `capacity` plus an audited `SlotCapacityOverride`; the claim path is identical for every booking.                                                   |
| 6   | Deterministic key order prevents deadlock but not a thundering herd; needs backoff and a retry budget.                                                                                                          | MAJOR    | Correct in general, largely dissolved by the granularity fix.                                                                                                                             | **Accepted in part.** Order retained; exponential backoff with jitter and a strict budget specified in [05](05-transactions-and-data-integrity.md).                                  |
| 7   | Materialized slot claims are a simpler and stronger mechanism.                                                                                                                                                  | MAJOR    | Agreed — this was recorded as the "upgrade path" and should have been the primary design. The reasoning that talked me out of it (document count, cleanup) was outweighed by correctness. | **Accepted.** It is now the primary design.                                                                                                                                          |
| 8   | Retry + `onAbort`/`onCommit` interaction is undefined: a first failed attempt's `onAbort` could delete an asset the retry needs.                                                                                | MAJOR    | Correct and a real hole.                                                                                                                                                                  | **Accepted**, fixed in [05](05-transactions-and-data-integrity.md) with attempt-local vs. final hooks.                                                                               |

> ### ⛔ MANDATORY GATE — Phase 6 must not start before this
>
> **A second adversarial review of this rewritten `ScheduleSlot` mechanism is a
> hard prerequisite for Phase 6 implementation.** The Codex usage limit was
> reached immediately after the first pass (resets 2026-08-25). This rewrite
> answers the first review's findings but has not itself been attacked, and it is
> the single most correctness-critical mechanism in the plan. Closing the overall
> product roadmap does **not** wait on this; starting Phase 6 does.

Queued questions for that pass:

1. Does the conditional `$inc` under `consumed < capacity` distinguish a **write
   conflict** (retry) from a **filter miss** (genuine 409) unambiguously inside a
   transaction, or can the two be confused?
2. Can `consumed` **drift** — double release, release without claim, a partially
   claimed interval that aborts — and should `appointmentIds.length` be the
   source of truth rather than a separate counter? A counter that can drift from
   the array it accompanies is a classic defect, and this design currently has
   both.
3. Is `SLOT_MINUTES = 5` right, given it creates 6 rows per 30-minute
   appointment per scope? What is the migration when an organization changes it
   while slots exist?
4. Does the 90-day horizon create a cliff at day 91, and what happens when
   availability is edited a year ahead?
5. Did this trade one problem for another versus the day-lock design?

**This is a known gap, not a completed review.** Item 2 in particular looks like a
real weakness on re-reading, and I would expect a reviewer to find it.
