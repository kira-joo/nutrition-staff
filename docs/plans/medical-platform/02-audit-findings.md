# 02 — Audit findings: verified current state

**Status: APPROVED 2026-08-22.** Findings dated 2026-08-22 and
derived from reading source, not from prior planning documents. Where a number
appears, it was counted. Inferences are labelled.

## Purpose

The evidence base for every architectural decision in this directory. Read this
before disagreeing with [03](03-target-architecture.md) or [04](04-domain-model.md).

## Method

Four parallel read-only audits: backend/domain (all of `src/server/**`, all 102
`src/app/api/**/route.ts`, all of `scripts/**`), frontend/UX (all 84 non-api
route files, `src/common/**`, `src/components/**`, the Tailwind config), the
seven shared packages, and documentation/git/cross-repo coupling. Findings were
cross-checked against each other and, where they disagreed with existing
planning docs, resolved in favour of the code.

## Scale

| Area | Count |
|---|---|
| App-owned Mongo collections | 22 (+2 toolkit-owned: `Role`, `Permission`) |
| API route files | 102, with 167 handler exports |
| — of which unauthenticated | 20 |
| — of which bypass the route factory (binary responses) | 4 |
| Public API routes (`/api/public/**`) | 18 — exactly saturated, every one consumed |
| UI pages (`page.tsx`, non-api) | 81, plus 3 layouts |
| — rendered as server components | **3** |
| — using the shared `PageShell` | 61 |
| Generated permission keys | 135 (27 entities × 5 actions) |
| Seeded roles | 4, one of which has zero permissions |
| Test files in the whole app | **1** |
| Backend test files | **0** |

## Findings by area

### The identity model is the best thing in the repository

`User` is a pure identity/auth record with two **optional, independent** 1:1
satellites: `ClientProfile` and `StaffProfile`. Neither is inferred from
`roles`, and there is deliberately no `UserType` field. The schema doc comment
at `src/server/users/user.schema.ts:5-16` states this explicitly, and
`staff-profile.schema.ts:8-13` mirrors it.

This is exactly the right shape for a medical platform, where one person can
simultaneously be a patient, a staff member, and a referrer. **It is kept.**

### Ten specific structural defects

| # | Defect | Evidence | Fixed in |
|---|---|---|---|
| L1 | Four settings singletons hardcode "one clinic, one doctor, one website" via `where: {}` | `src/server/core/singleton/get-or-create-singleton.ts` + 8 call sites | [06](06-organization-and-branches.md) |
| L2 | Zero multi-tenancy anywhere. `grep -niE "tenantId\|orgId\|clinicId\|branchId" src` → **0 hits**. Not one of 24 collections carries a scope field | grep | [06](06-organization-and-branches.md) |
| L3 | Zero resource-scoped authorization. `authorizeUser` compares permission-key sets only; `clients/[id]/route.ts` never compares `assignedToUserId` to `user._id`; `dashboard-scope.util.ts:12` returns "no scoping" when the *requester* omits the filter | `backend-toolkit-next/src/authorization/authorize-user.ts` | [07](07-authorization-roles-permissions.md) |
| L4 | `DoctorProfile` is a public-website CMS singleton with no `userId` — not a practitioner. It already burns the name a real `Practitioner` wants, plus 5 permission keys and a cache tag shared with `nutrition-client`. Books structurally assumes one doctor | `src/server/doctor-profile/doctor-profile.schema.ts`; `book.schema.ts` `bookOverridesSchema` | [04](04-domain-model.md), [23](23-site-cms-and-books-disposition.md) |
| L5 | Two contradictory i18n models coexist: `LocalizedString {ar,en}` on ~14 CMS entities, plain Arabic strings in Books, and **plain untranslated strings on every clinical/CRM field**. So the machinery is on the content that won't ship and absent from the content that will | `toolkit-common` `LocalizedString`; `book.schema.ts:53-56` | [17](17-ux-architecture-and-design-system.md) |
| L6 | The `CacheTag` vocabulary is hand-duplicated across two repos **and has already drifted** — `nutrition-client` has `video(id)`, `nutrition-staff` does not, so a video detail page can never be invalidated | `src/server/core/revalidation/cache-tag.ts` vs `nutrition-client/src/lib/cache/cache-tags.ts` | Phase 0D |
| L7 | **No index on any clinical foreign key.** `@Filterable()` and `@Relation()` build none — `apply-indexes.ts` indexes only `@Unique()`. So every per-patient timeline query is a collection scan | `backend-toolkit-mongoose/src/schema/apply-indexes.ts` | Phase 0D, [19](19-toolkit-and-package-changes.md) |
| L8 | **No transactions, anywhere, by explicit convention**, across six multi-collection write paths | `src/server/clients/create-client.ts:19-22` | [05](05-transactions-and-data-integrity.md) |
| L9 | `User` has **no soft delete** but every clinical record FKs to it. `DELETE /api/users/:id` hard-deletes and orphans the graph; `scripts/seed-users.ts` runs `UserModel.deleteMany({})` | `src/server/users/delete-user.ts`; `scripts/seed-users.ts` | Phase 3 (M3) |
| L10 | `User.phone` is `@Unique({sparse:true})` — **a mother and child sharing a phone number cannot both exist**. A 409 on a normal clinic registration | `src/server/users/user.schema.ts` | Phase 3 (M4), [09](09-patients.md) |

Plus: `NutritionCalculation.inputs`/`results` are unvalidated `Mixed` persisted
verbatim from the client without re-running the engine; `EntityName` is a single
flat enum that is simultaneously the model name, collection-name basis,
permission-key prefix, every schema `ref`, and the UI label key; only `admin` can
use the app (L11 in the raw audit); `POST /api/auth/signup` is `auth: false` and
mints identities in the shared `users` collection; the in-memory rate limiter and
in-memory dashboard aggregation do not survive scale-out; `Africa/Cairo` and
`EGP` are compile-time global constants.

### Quality is high; design is deliberately absent

The engineering is unusually careful — inline comments explain *why*, cite
measurements, and name the bug each decision prevents. Genuinely good, and kept:

- `ClientInteraction` (`src/server/interactions/**`) — an append-only contact
  timeline with a `CONTACT_TYPES` set deciding whether `lastContactedAt` moves, a
  backdating guard, and system-generated entries that throw `ForbiddenError` on
  edit or delete so the lifecycle audit trail is untamperable. **Zero nutrition
  coupling.** This is the most directly reusable clinical module in the repo.
- The nutrition `engine/` (10 files) — versioned formulas with provenance
  (Mifflin-St Jeor 1990, revised Harris-Benedict 1984, Katch-McArdle 1996),
  explicit `SAFE_FLOOR_KCAL` of 1200♀/1500♂ that returns `null` rather than
  silently clamping, age gating at 10–110, and an `assumptions[]` string appended
  for every skipped inference. **And zero tests, for 10 files of pure
  deterministic arithmetic encoding clinical safety rules.** The single most
  glaring gap in the codebase.
- Measurement provenance: BMI is derived at write and `heightCmUsed` is stored
  alongside, so the derivation stays auditable if height later changes.
- `create-consultation-request.ts` — honeypot, minimum-time-to-submit, per-IP
  rate limit, and it **always** returns `{success:true}` so an unauthenticated
  caller can never learn whether a phone number exists in the CRM.
- The 409 duplicate-identity resolution flow in `src/common/forms/client-form.tsx`
  — the best-designed UX in the app.
- `/dashboard` (384 lines) — the only screen with real information design:
  period-over-period KPI deltas, follow-up lists deliberately placed *above* the
  charts, and a "nothing needs attention" success empty state.

Against that: `tailwind.config.js` is 28 lines with `theme: { extend: {} }`,
`globals.css` is three `@tailwind` lines, **zero CSS variables are defined in the
app**, there is no typography system and no spacing scale, `motion` is not a
dependency, `prefers-reduced-motion` appears **zero** times, and 40 of 81 pages
are interchangeable CRUD scaffolds. A 20-line comment in the Tailwind config
states the absence of a theme is deliberate. Design quality is not degraded —
it was never attempted.

### The toolkit is stronger than assumed, and under-used

Already exists and should not be rebuilt: the permission registry
(`createAuthorizationRegistry` → typed `AppPermission.X.READ`), `hasPermission`,
`drawerPresentation` (focus-trapped, scroll-locking, RTL-logical),
`useConfirm`/`useAlert`, `KpiCard`/`DeltaIndicator`/`ChartCard`, `Timeline`,
`PageShell`/`PageSection`/`InfoRow`, `FeatureTable` with URL sync, `CustomForm`
with 18 field types, `QueryState`, 13 DST-correct timezone functions, soft
delete, `revalidateTags`, and the `--ftk-*` role token contract.

Under-used to the point of waste: `drawerPresentation` — **0 uses**;
`FeatureComboBox` — 0; `PermissionBoundary` — 0; `Skeleton` — 0; `BarChart`,
`Sparkline` — 0 outside the dashboard; `createCrudEndpoints` — 0 in either app.
And `nutrition-staff` imports the **root barrel** in 147 files while the package
ships 16 granular entries specifically to avoid it; `tsup.config.ts:20-45`
records the measured cost as **93 kB First Load JS** per barrel import, with
zero staff files using `/table`, `/forms`, `/inputs`, `/charts` or `/primitives`.

Genuine toolkit gaps, in priority order: **any calendar or scheduling UI**
(the single biggest), **resource-scoped authorization**, audit/event primitives
(0 grep hits for `audit` across all seven packages), `createdBy`/`updatedBy`,
`withTransaction`, repository aggregation, money, command palette (though `cmdk`
is already a dependency), notifications, date-range and range/multi-select table
filters, saved views, field arrays, `raw`/document asset upload with private
signed delivery, duration/interval/overlap math, and recurrence.

Two correctness defects to fold in: `Timeline` uses physical `border-l` /
`-left-[29px]` so it mirrors wrong under RTL, and `ResolvedRole` +
`hasPermission` are defined **twice**, once per side of the stack.

### The cross-repo contract is small and clean

`grep -rn 'ClientProfile|Patient'` across all of `nutrition-client` returns
**0 matches**. No public route exposes the patient entity. The entire coupling
is four things, and freezing them makes every internal restructuring invisible
to the public site:

1. The 18 `/api/public/**` route paths.
2. Twelve `domain/*.ts` response-shape mirrors in `nutrition-client`.
3. The `CacheTag` string vocabulary (plus `CACHE_POLICY`, where a new static tag
   is a compile error until added).
4. The `ConsultationRequestIntent` enum.

The revalidation contract itself: staff POSTs `{tags}` to
`${NUTRITION_CLIENT_URL}/api/revalidate` with a bearer `REVALIDATE_SECRET`, a
2500 ms `AbortController` cap, awaited (not detached — serverless), best-effort,
and a no-op if either env var is unset.

### Infrastructure reality

No CI anywhere — no `.github/**`, no Dockerfile, no compose file, no
`vercel.json` in any of the nine repos. Deployment is manual, Vercel-shaped
(`next.config.mjs` bundles `@sparticuz/chromium`; `publish-revalidation.ts`
reasons about serverless freeze semantics). No migration framework — seven
hand-written one-off `tsx` scripts with per-script idempotency against a chosen
natural key, no history, no ordering, no down. `scripts/qa/` holds 13 real
verification helpers, of which 8 are Books/PDF-related and 4 are auth
workarounds that exist because a fresh signup has zero permissions. Git: three
repos have unpushed `staging` commits (client 34, staff 14, tailwind 13), and the
four backend toolkits have **no `staging` branch at all** despite the workspace
policy requiring one.

## What this means for the plan

1. Keep the identity split, the interaction timeline, the calculation engine, the
   asset pipeline, the route-factory conventions, and the soft-delete-everywhere
   habit.
2. Treat the ten defects above as Phase 0/3/4 work, not as things a feature phase
   fixes in passing. Six of them (L2, L3, L7, L8, L9, L10) are cheap now and
   expensive after there is production patient data.
3. Fence the four pillars before adding anything, because more than half of what
   is here does not belong in the product being sold.
4. The toolkit needs additions, not a rewrite — and one of the highest-value
   changes (adopting `drawerPresentation` and the granular entry points) is pure
   app-side adoption with no package work at all.

## Codex findings and resolution

Not yet consulted. The audit claims most worth an independent challenge:
(a) that `@Filterable()` builds no indexes and every patient-timeline read is
therefore a scan; (b) that the `Client → Patient` rename has zero
`nutrition-client` blast radius; (c) that more than half the code would not ship
in a sellable platform. All three drive expensive decisions.
