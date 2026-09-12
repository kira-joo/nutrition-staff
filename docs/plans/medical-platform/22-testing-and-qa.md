# 22 — Testing and QA

**Status: APPROVED 2026-08-22.** Phase 0A; every phase after
carries its own tests as an acceptance gate.

## Purpose

Build the test infrastructure that does not exist, pay down the highest-risk test
debt, and define the verification bar every phase must clear.

## Current state

**One test file in the entire application**:
`src/common/forms/star-rating-input.test.tsx` (212 lines, a keyboard- and
RTL-correct star rating widget). **Zero backend tests.**

`vitest.config.ts` is **jsdom-only with no node project**, so a backend test
cannot run today without a config change. `vitest` 2.1.9,
`@testing-library/react`, and `jsdom` are all configured and essentially unused.

The framework is well tested — the toolkit packages carry 121 test files in
`frontend-toolkit-tailwind`, 49 in `backend-toolkit-mongoose`, 26 in
`backend-toolkit-next`, 17 in `frontend-toolkit-core`, 16 in
`backend-toolkit-core`, 6 in `toolkit-common`. So the _plumbing_ is tested and
the _application's own domain logic is not at all_.

`scripts/qa/` holds 13 real verification helpers, and they are good: a headless
Chromium mobile-overflow regression check that asserts
`documentElement.scrollWidth/scrollHeight` never exceed the viewport while still
allowing a table's own scroll wrapper to overflow locally; a Books paragraph
mark-split check that runs the actual production paginator inlined via
`.toString()`; a staff↔client mark-renderer parity drift guard; a PDF smoke
test; a publish-lifecycle verification. **But 8 of 13 are Books/PDF-related and
4 are auth workarounds** that exist because a fresh signup has zero permissions.
**None touches clinical logic.**

There is **no CI in any of the nine repositories** — no `.github/**`, no
Dockerfile, no compose file.

## The test debt, ranked

1. **The nutrition calculation engine.** Ten files of pure, IO-free,
   deterministic arithmetic encoding clinical safety rules — safe calorie floors,
   age bounds, formula fallbacks, macro arithmetic — with zero tests. It is
   simultaneously the highest-value and cheapest-to-test code in the repository.
   Eleven required test groups in [13](13-nutrition-vertical.md).
2. **`create-client.ts`'s conflict and rollback branches** — non-transactional,
   with a manual compensating delete, untested.
3. **`create-consultation-request.ts`** — three identity-resolution branches plus
   honeypot, timing and rate-limit gates, all untested, on the only public write
   endpoint.
4. **`src/server/interactions/**`** — the `lastContactedAt` backdating guard,
   `CONTACT_TYPES` membership, and `isSystemGenerated` immutability. The best
   business logic in the repo, entirely unprotected.
5. **`dashboard-time-buckets.util.ts`** — timezone bucketing, zero-filling and
   cumulative series. Untested, and the kind of code that fails silently on a DST
   day.
6. **Authorization wiring** — no test asserts any route's `auth` option.
7. **`profile-completeness.ts`** — its own comment describes a shipped bug
   (an optional `hasMeasurement` silently changing the total from 5 to 4). Still
   untested.

Items 1, 2, 3, 4 and 5 are all Phase 0A, before any structural change, so the
pillar move and the `Client → Patient` rename are provably behaviour-preserving.

## Target state

### Test infrastructure

A **Vitest workspace** with two projects:

| Project | Environment | Covers                                                                                           |
| ------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `node`  | node        | `src/server/**`, `src/platform/**`, `src/verticals/**`, `core/**`, `migrations/**`, `scripts/**` |
| `dom`   | jsdom       | `src/app/**`, `src/common/**`, `src/components/**`                                               |

Integration tests use `mongodb-memory-server`, already a devDependency of
`backend-toolkit-mongoose` and used there in 15 test files. Transaction tests use
`MongoMemoryReplSet` — also already used, at
`create-mongoose-repository.test.ts:606` and `execute-save.test.ts:144`. **So the
harness for the hardest tests in the programme already exists and is proven.**

### The test pyramid, by layer

| Layer                        | What                                                                                                                                 | Tool                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Pure functions**           | The nutrition engine, money arithmetic, interval/overlap math, slot generation, invoice totals, age resolution, profile completeness | Vitest, no DB. The largest tier, and the cheapest.                        |
| **Repository / integration** | Schema constraints, indexes, soft delete, scope injection, **transaction commit and rollback**                                       | `mongodb-memory-server` / `MongoMemoryReplSet`                            |
| **Service / use case**       | Every multi-collection workflow, both committed and rolled back; state machines; permission scoping                                  | in-memory Mongo                                                           |
| **Route**                    | DTO validation, auth options, status codes, error shapes                                                                             | route handlers invoked directly, as `backend-toolkit-next`'s own tests do |
| **Component**                | Clinical banner, calendar, board, forms                                                                                              | Testing Library                                                           |
| **Browser QA**               | Real geometry, real flows, real Arabic                                                                                               | Playwright MCP + `scripts/qa/`                                            |

### Non-negotiable test categories per phase

Each is an acceptance gate, not a nice-to-have:

1. **Transaction commit + rollback** for every multi-collection write —
   [05](05-transactions-and-data-integrity.md) lists 23 framework cases plus one
   commit and one rollback test per workflow.
2. **State machine coverage** — every legal transition succeeds, every illegal
   one is rejected with the right status. Appointments, encounters, invoices,
   patients, leads.
3. **Authorization matrix** — table-driven, 8 roles × every protected route,
   generated from the seed so a new role cannot silently gain access. Negative
   cases are the point.
4. **Cross-organization isolation** — for every list endpoint, seed two orgs and
   assert org A cannot read org B. Written now, while there is one org.
5. **Migration idempotency** — every migration run twice.
6. **Concurrency** — MRN allocation, invoice numbering, and appointment
   double-booking each tested with parallel calls.
7. **Timezone / DST** — slot generation and dashboard bucketing across a DST
   transition.
8. **Immutability** — a signed encounter, an issued invoice, and a
   system-generated contact attempt each reject every mutation path.
9. **HTTP idempotency** — a replayed request with the same `Idempotency-Key`
   returns the stored response and does **not** re-execute. Tested per protected
   route. Transaction retries do not cover this: a double-clicked "Take payment"
   is two distinct HTTP requests.
10. **Optimistic concurrency** — a stale `expectedRevision` returns 409, for
    every concurrently-editable entity, not only encounters.
11. **TOCTOU on scoped mutations** — ownership changed between the guard and the
    handler must still fail the write, proving the query predicate carries the
    invariant rather than the guard.
12. **Backup restore** — at least once per programme, restore a dump into a
    scratch database and run the full migration sequence against it. "Take a
    dump first" is not a recovery design if nobody has ever restored one.

### Browser QA bar

From `.claude/skills/browser-visual-qa/SKILL.md`, and it governs:

> **For anything geometric, measure the DOM. Do not reason from CSS, and do not
> reason from a screenshot.**

- Viewports: **375 / 768 / 1440**, the established set.
- No page-level horizontal overflow at any width — a table's own
  `overflow-x` wrapper is allowed to scroll locally, and the existing
  `check-mobile-overflow.js` already encodes that distinction correctly. It is
  extended to every new route.
- Computed contrast ratios ≥ 4.5:1 text, ≥ 3:1 UI, measured not assumed.
- RTL correctness verified by **measuring element positions**, not by reading CSS
  — relevant to the calendar, the drawer, the timeline (which has a real physical-
  property bug today), and every Arabic content surface.
- Reduced-motion behaviour verified with the preference enabled.
- First-render stability: no layout shift after hydration on the role homes, the
  calendar, or the patient record.
- Arabic content: long-Arabic overflow in editors, previews and printed output,
  with `lang="ar"` present alongside `dir="rtl"`.

### `scripts/qa/` additions

`check-import-boundaries.ts` (the pillar rule from
[03](03-target-architecture.md)) · `check-no-manual-sessions.ts` (no
`startSession` outside the toolkit) · `check-cache-tag-parity.ts` (the staff↔client
`CacheTag` drift that already exists — modelled on the proven
`check-mark-renderer-parity.ts`) · `check-permission-matrix.ts` ·
`check-contrast.ts` · `seed-demo-clinic.ts` (tier 2 from
[21](21-migrations-and-seeding.md)).

The four auth-workaround scripts become unnecessary once tier-1 seeding produces
usable roles, and are retired rather than left as folklore.

### Coverage targets

Deliberately targeted rather than a blanket percentage:

| Area                              | Target                               |
| --------------------------------- | ------------------------------------ |
| The nutrition engine              | **100% branch**                      |
| Money and interval math           | 100% branch                          |
| State machines                    | every transition, legal and illegal  |
| Multi-collection workflows        | commit + rollback each               |
| Migrations                        | idempotency each                     |
| Authorization                     | every protected route                |
| Idempotency and concurrency paths | every protected route                |
| Everything else                   | meaningful tests, no percentage gate |

A global coverage number would be gamed by testing the 40 interchangeable CRUD
pages and would say nothing about the code that matters.

### CI — approved, and part of the plan

There is none today in any of the nine repositories. **Minimal CI is approved and
is a Phase 0 deliverable (track 0E)**, not an optional recommendation. Without
it, every acceptance gate in these 25 documents is enforced by discipline alone,
and one test file across an entire application is evidence that discipline has
not been sufficient here.

Deliberately minimal. This is a quality gate, not a DevOps programme: no
deployment automation, no environments, no matrix builds, no caching strategy
beyond the default, no release automation. **Publishing stays manual and
explicitly approved** per `.claude/skills/release-and-publish/SKILL.md` — CI must
never publish a package.

One workflow per repository, running on push and on pull request, covering the
subset relevant to that repository:

| Step                                                             | Applies to                 | Notes                                                                                                                                                                                   |
| ---------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit`                                               | all 9                      | `nutrition-staff` has no `typecheck` script; this is the command                                                                                                                        |
| `npm test`                                                       | all 9                      | Vitest everywhere. For `nutrition-staff` this is the node + dom workspace from above                                                                                                    |
| `npm run build`                                                  | both apps + all 5 toolkits | catches the "compiles in dev, fails in build" class                                                                                                                                     |
| `scripts/qa/check-import-boundaries.ts`                          | `nutrition-staff`          | the four-pillar rule ([03](03-target-architecture.md))                                                                                                                                  |
| `scripts/qa/check-route-inventory.ts`                            | `nutrition-staff`          | proves no route URL changed ([03](03-target-architecture.md))                                                                                                                           |
| `scripts/qa/check-transaction-rules.ts`                          | `nutrition-staff`          | no manual sessions, no swallow-without-mark ([05](05-transactions-and-data-integrity.md))                                                                                               |
| `scripts/qa/check-cache-tag-parity.ts`                           | `nutrition-staff`          | the staff↔client `CacheTag` drift that already exists                                                                                                                                   |
| Migration tests                                                  | `nutrition-staff`          | every migration run twice for idempotency ([21](21-migrations-and-seeding.md))                                                                                                          |
| `scripts/qa/check-route-inventory.ts` + Next build-manifest diff | `nutrition-staff`          | three-part route proof ([03](03-target-architecture.md))                                                                                                                                |
| `npm pack` + smoke install into a scratch project                | the 5 toolkit repos        | catches the "works locally, broken once published" class that a symlink hides. This is the CI counterpart of the manual tarball verification the `shared-package-change` skill requires |

Notes on scope and cost:

- Transaction and concurrency tests need a replica set. `MongoMemoryReplSet` runs
  in CI without external services — it is already a devDependency of
  `backend-toolkit-mongoose` and already used there — so no database service
  definition is required.
- The two apps are `private: true` and are never published; their workflows do
  not touch the registry at all.
- Registry auth in CI uses `${GITHUB_PACKAGES_TOKEN}`, which the existing
  `.npmrc` files already reference. **`.npmrc` must not be edited** — the local
  401 inside app directories is expected and by design.
- Estimated cost: roughly one day to set up across all nine repos.

Recorded as approved in [25](25-risks-and-open-decisions.md) D2.

## Acceptance criteria

- [ ] A Vitest node project exists and backend tests run.
- [ ] The nutrition engine is at 100% branch coverage, including the safe-floor
      refusal and every `assumptions[]` string.
- [ ] All five ranked Phase 0A debt items have tests before any structural change.
- [ ] Every multi-collection workflow has a commit and a rollback test.
- [ ] The authorization matrix covers every protected route.
- [ ] Cross-organization isolation tested on every list endpoint.
- [ ] Every migration proven idempotent.
- [ ] `check-mobile-overflow.js` extended to every new route and passing.
- [ ] The four auth-workaround QA scripts retired.
- [ ] Minimal CI running in all nine repositories, covering the table above, and
      publishing nothing.

## Codex findings and resolution

**Reviewed 2026-08-22.** The review's "anything the plan misses entirely" list
produced four additions here, all accepted: HTTP-level idempotency testing,
optimistic-concurrency testing beyond encounters, TOCTOU testing on scoped
mutations, and an actual restore rehearsal rather than an assumption that a dump
is a recovery plan. It also confirmed that a static route manifest needs contract
tests alongside it ([03](03-target-architecture.md)).

**Still open:** whether direct route-handler invocation is sufficient for the
authorization matrix, or whether a real HTTP integration layer is needed to catch
middleware and header-level behaviour.
