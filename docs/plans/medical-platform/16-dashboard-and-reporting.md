# 16 — Dashboards and reporting

**Status: APPROVED 2026-08-22.** Phase 11.

## Purpose

Role-relevant, actionable dashboards — and the aggregation infrastructure they
need, which is the part that does not exist.

## Current state

`/dashboard` is the best screen in the application. 384 lines: eight KPI cards
with period-over-period deltas, a filter bar with presets plus a custom range
plus a staff filter, three charts, an activity timeline, dynamic attention lists,
and a "nothing needs attention" success empty state. Follow-up lists are
deliberately placed **above** the charts, with a comment saying they must never
be buried under them. Seven read-only endpoints back it.

`dashboard.constants.ts` centralises ten thresholds, each with a rationale
comment (`STALE_MEASUREMENT_DAYS=60`, `NOT_CONTACTED_RECENTLY_DAYS=30`,
`NO_ASSESSMENT_GRACE_DAYS=14`, and so on), and every attention list follows a
uniform "never flag on day one" grace-window rule.
`dashboard-time-buckets.util.ts` does timezone-correct day/week/month bucketing
via the `toolkit-common` zone helpers, zero-fills gaps, and offers cumulative
series. There is genuine field-level permission awareness:
`dashboard-permissions.util.ts` resolves `canViewMeasurements` /
`canViewAssessments` / `canViewCalculations` and *omits* those slices rather than
failing.

**And it will not survive.** `get-dashboard-attention.ts` loads **all** active
and all non-terminal clients with populated relations into process memory, then
all of their measurements and assessments. `get-dashboard-activity.ts` merges
five collections in application code, each capped at 20 then re-sorted.
`list-users.ts` loads every `userId` from both profile collections when
`profileType` is set. Fine at 200 patients; not at 20,000.

The root cause is structural: **`backend-toolkit-mongoose` has no
`aggregate()`.** Zero `.aggregate(` calls exist in the package. Every KPI is
therefore hand-computed in JavaScript over documents pulled into memory. There
is also no CSV or XLSX export anywhere, and no saved views.

## Target state

### Aggregation, first

A repository `aggregate(pipeline, options)` escape hatch in
`backend-toolkit-mongoose`, session-aware and org-scope-aware, plus a small set
of typed pipeline builders for the shapes actually needed: count-by-period,
count-by-field, sum-by-period, and distinct-count. Not an aggregation DSL — a
thin, session-participating passthrough with the tenant filter injected, so a
pipeline cannot accidentally read across organizations.

Every KPI and every attention list moves from in-memory computation to an
aggregation pipeline. The thresholds stay exactly where they are conceptually —
centralised with their rationale — but move from constants to
`Organization.settings`.

### Role-based dashboards, not one dashboard

The brief asks for different workspaces rather than one screen for everyone.
Each role's home is defined in [17](17-ux-architecture-and-design-system.md);
this document specifies the data.

**Receptionist / front desk**
Today's appointments by practitioner · waiting board summary with longest wait ·
unconfirmed appointments for tomorrow · walk-ins waiting · today's takings ·
patients with a balance who are in the building right now · tasks due today.

**Doctor**
My patients today, in order, with check-in state · **my draft encounters**
(unsigned, oldest first — the single most useful number for a clinician) ·
my follow-ups due · abnormal observations recorded for my patients since I last
looked · my week's load. Explicitly **no** revenue and no CRM funnel.

**Clinic admin / owner**
Revenue by period with a previous-period delta, by branch and by practitioner ·
appointment volume, no-show rate and cancellation rate · new patients · patient
retention (returning within N days) · outstanding receivables by age bucket ·
practitioner utilisation (booked minutes ÷ available minutes — the KPI that
actually drives a clinic's decisions) · follow-up compliance · top services by
revenue.

**Billing clerk**
Unpaid and overdue invoices by age · today's payments by method · discounts
issued above threshold · refunds.

Every widget declares its required permission and is omitted, not errored, when
absent — extending the existing `dashboard-permissions.util.ts` pattern, which is
already right.

Verticals contribute widgets via `VerticalModule.dashboardWidgets`
([12](12-vertical-extension-model.md)), which is how the three nutrition
attention lists survive without the platform knowing about them.

### Reports

A small, fixed set — not a report builder: revenue detail, appointment
statistics, practitioner productivity, patient retention, outstanding
receivables, follow-up compliance. Each filterable by date range, branch and
practitioner, each exportable to CSV. CSV export is a toolkit gap and is a
release-wave-B item.

Deliberately out of scope: a custom report designer, scheduled email reports,
data warehouse export, and any BI integration.

## Screens

`/` becomes the role home (it is currently an h1, a "Welcome" and one button —
effectively a placeholder). `/reports/*` for the fixed reports.
Every KPI is **clickable and navigates to the filtered list behind it** — a
number a user cannot drill into is decoration, which the brief explicitly
prohibits.

## APIs

`GET /api/dashboard/home?role=` — one composed call per role home rather than
the current seven parallel requests, because a role home that fires seven
requests feels slow no matter how fast each one is. Backend-owned composition,
consistent with the workspace convention that made `GET /api/public/faq` the
canonical example.
Plus `GET /api/reports/:reportKey` with filters, and
`GET /api/reports/:reportKey/export?format=csv`.

## Performance

- Every dashboard query is an aggregation with an index behind it. No unbounded
  `find()` into memory. This is a hard rule and the reason aggregation is a
  prerequisite rather than an optimisation.
- Attention lists are capped with an explicit "and N more" affordance, never
  silently truncated.
- Heavy aggregates are cached per organization for a short TTL, using the
  existing `createCachePolicyResolver` from `frontend-toolkit-core` rather than a
  new mechanism.
- A target: the role home responds in under 500 ms at 20,000 patients and
  200,000 appointments, measured against a seeded dataset. That seeded dataset is
  a deliverable of [21](21-migrations-and-seeding.md), because a performance
  claim without one is an opinion.

## Testing strategy

Each aggregation against a fixture with a hand-computed expected value ·
timezone-boundary correctness for day and week buckets, including a DST day
(the existing `dashboard-time-buckets.util.ts` logic is untested today) ·
permission omission per widget · cross-organization isolation for every
aggregate · the performance target measured, not asserted · CSV export escaping
(commas, quotes, newlines, Arabic text, and the BOM that Excel needs for UTF-8).

## Acceptance criteria

- [ ] No dashboard endpoint loads an unbounded collection into memory.
- [ ] Each role home is one request and returns only permitted data.
- [ ] Every KPI drills through to its underlying list.
- [ ] Practitioner utilisation is computed and correct.
- [ ] Thresholds are organization settings, not constants.
- [ ] The 500 ms target is met against the seeded large dataset.
- [ ] Nutrition's three attention lists still work, contributed by the vertical.

## Codex findings and resolution

Not yet consulted. Ask: (a) is a raw `aggregate()` passthrough the right toolkit
addition, or does it invite unscoped pipelines that bypass tenant filtering?
(b) is one composed role-home endpoint better than parallel granular ones for
caching and for partial failure? (c) should read-model denormalisation be
adopted for the heaviest aggregates rather than computing them per request?
