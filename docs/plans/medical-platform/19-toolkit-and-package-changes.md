# 19 — Toolkit and package changes

**Status: APPROVED 2026-08-22.** Release wave A gates Phases
2–6; wave B gates Phase 11.

**Every publish in this document requires its own explicit approval.** Per
`.claude/skills/release-and-publish/SKILL.md` that authorisation is per-instance,
never standing. Verification before any publish is `npm run build && npm pack`
plus a tarball install in a real consumer — never a symlink, never a
`node_modules` swap.

## Purpose

Specify exactly what changes in each of the seven shared packages, in dependency
order, and which app work each release unblocks.

## Governing facts

- In this workspace, **`0.x` minor versions carry breaking changes**. A new
  behaviour is a minor, not a patch.
- Current versions: `toolkit-common` 0.4.0 · `frontend-toolkit-core` 0.5.1 ·
  `frontend-toolkit-tailwind` 0.11.0 · `backend-toolkit-core` 0.4.1 ·
  `backend-toolkit-next` 0.4.1 · `backend-toolkit-mongoose` 0.3.3 ·
  `backend-toolkit-cloudinary` 0.1.2.
- `nutrition-client` is on `toolkit-common@0.3.1` and
  `frontend-toolkit-core@0.5.0` while staff is on 0.4.0/0.5.1. No peer range is
  violated today, but the client will not receive later `toolkit-common`
  additions until it is bumped. **Any `toolkit-common` change must be checked
  against `nutrition-client` as well as staff** — this is the one place a toolkit
  change can break the public website.
- `frontend-toolkit-tailwind`'s peer range for `frontend-toolkit-core` stops at
  `^0.5.0`; a 0.6 core requires a peer bump.
- Git: `toolkit-common`, `frontend-toolkit-core` and `frontend-toolkit-tailwind`
  have a `staging` branch. **The four backend toolkits are on `main` with no
  `staging` branch at all** — workspace policy requires one, so creating it is a
  prerequisite of wave A-backend.

## Triage: what is reused, extended, or built locally

| Capability needed | Exists today | Verdict |
|---|---|---|
| Permission registry, typed keys, role/permission persistence, `syncPermissions` | `backend-toolkit-core/src/authorization/`, `backend-toolkit-mongoose/src/authorization/` | **Reuse. Do not rebuild.** Custom actions are already supported via the `actions?` override. |
| Route-level permission authorization | `backend-toolkit-next` `RouteAuthOption` | **Reuse.** |
| Resource-scoped authorization | nothing | **Extend** `backend-toolkit-next` only (a generic post-validation guard hook). The *rules* are app-local, and the guard is defence-in-depth — real authorization goes in the query filter. |
| Organization/tenant scoping | nothing | **Extend** `backend-toolkit-mongoose` (scope injection); the org *concept* is app-local |
| Transactions | `session` threaded everywhere, nothing starts one | **Extend** `backend-toolkit-mongoose` — [05](05-transactions-and-data-integrity.md) |
| `createdBy`/`updatedBy` | nothing | **Extend** `backend-toolkit-mongoose` |
| Audit event record | nothing anywhere (0 grep hits) | **Extend** `backend-toolkit-core` with the `AuditWriter` *interface* only. Schema, repository, semantics, redaction and retention all **local**. |
| Aggregation | no `.aggregate(` in the package | **Extend** with a raw, explicitly unscoped primitive on the global repository only. Reporting builders stay **local**. |
| Indexes | only `@Unique` is indexed | **Extend** with `@Index()` only. Auto-indexing `@Filterable` dropped — see below. |
| Money | nothing | **Extend** `toolkit-common` with `bigint` arithmetic + ISO 4217 exponents. Formatting and parsing stay out of it — see below. |
| Duration / interval / overlap math | zone-boundary math only | **Extend** `toolkit-common` |
| Recurrence (RRULE) | nothing | **Local, and minimal** — weekly + exceptions only. A recurrence engine is deferred |
| Patient documents with access control | `image`\|`video` only, all public URLs | **Extend** `toolkit-common` + `backend-toolkit-cloudinary`. **Blocker until done.** Not the same thing as compliance — see [08](08-platform-foundation.md). |
| Calendar / scheduling UI | nothing | **Build app-local**, after a library bake-off. Toolkit extraction deferred — see the calendar decision below. |
| Command palette | `cmdk` present, used only in combobox internals | **Extend** with the accessible shell only; registry, orchestration, persistence and permission filtering all **local**. |
| Advanced table filters | `SELECT` + `COMBOBOX` only, vs 13 backend `FilterOperator`s | **Extend** `frontend-toolkit-tailwind` |
| Saved views | nothing | **Local** — the persistence is app-shaped (per user, per org); revisit for wave B |
| Notifications | nothing | **Local** — the entity, delivery and preferences are product decisions |
| `can()` hook | `hasPermission` exists as a function; no hook, and it is **duplicated** front/back | **Extend** — consolidate into `toolkit-common`, add the hook to `frontend-toolkit-core` |
| Drawer / sheet | `drawerPresentation` fully built | **Reuse. Adopt it — 0 current uses.** No package change. |
| KPI cards, charts, timeline, page shell, forms, table, states, toasts, dialogs, soft delete, revalidation, bilingual content, PDF, passwords/JWT | all present | **Reuse** |
| Timeline RTL (physical properties) | bug | **Fix** in `frontend-toolkit-tailwind` |
| Patient banner, waiting board, encounter workspace, vitals entry, diagnosis/prescription UI, invoice line editor, severity mappings | — | **Local, permanently.** Healthcare composition never enters a toolkit. |

## Wave A-backend

### 1. `toolkit-common` 0.4.0 → 0.5.0

| Addition | Detail |
|---|---|
| `Money` | `{ amountMinor: bigint; currency: string }` + `addMoney`, `subtractMoney`, `multiplyMoney(m, factor, rounding)`, `allocateMoney(m, weights)` (remainder-safe), `compareMoney`, `zeroMoney`. Currency mismatch throws. **Amended after review:** `bigint` rather than `number` (a `number` silently loses precision past 2^53, which a lifetime of minor units can reach); an **ISO 4217 exponent table** so JOD/KWD (3 decimals) and JPY (0) are correct rather than assumed-2; and an explicit `RoundingMode` on every lossy operation. Serialization to/from JSON is an explicit `toMoneyJson`/`fromMoneyJson` pair, since `bigint` is not JSON-native. |
| **not** `formatMoney` / `parseMoney` | **Removed from `toolkit-common` after review.** `formatMoney` mixes `Intl` presentation with domain arithmetic and belongs next to the UI; `parseMoney` on free text is actively dangerous as a generic API (locale decimal separators, grouping, currency symbols). Formatting lives in `frontend-toolkit-tailwind`'s `MoneyText`; parsing lives in the app's form layer where the locale is known. |
| `ResolvedRole`, `hasPermission`, `PermissionMode` | **Moved here** from their two current homes (`backend-toolkit-core/src/authorization/` and `frontend-toolkit-core/src/auth/permission.utils.ts`), which define them independently today. Both packages re-export from here, so no consumer import changes. This is the fix for a real duplication. |
| Interval math | `Interval {start: Date; end: Date}` + `intervalsOverlap`, `intervalContains`, `mergeIntervals`, `subtractIntervals`, `splitIntervalIntoSlots(interval, minutes)`, `durationMinutes`. Pure, timezone-agnostic — it operates on instants. |
| Wall-clock helpers | `wallClockToInstant(date, "HH:mm", timeZone)`, `instantToWallClock`. Builds on the existing `zonedComponentsToUtcInstant`. This is what makes recurring availability DST-correct. |
| `DocumentAsset` | The third asset type beside `ImageAsset`/`VideoAsset`: `{ provider, assetKey, mediaKind, accessPolicy, resourceType, deliveryType, version, format, mimeType, bytes, checksum, originalFilename, pageCount? }` — an **opaque provider locator plus metadata, with no delivery URL**. A private URL must be generated per request; a stored one is either permanently valid or permanently stale. |
| `AssetResourceType` gains `"raw"` | — |

Semver: minor (additive; the `hasPermission` move is source-compatible via
re-export). **Consumer check: `nutrition-client` uses `toolkit-common` in 33
files** and is pinned at 0.3.1 — it does not need this release, but the peer
ranges must stay coherent.

### 2. `backend-toolkit-core` 0.4.1 → 0.5.0

| Addition | Detail |
|---|---|
| **A post-validation guard hook — renamed and re-scoped after review** | `RouteAuthOption` does **not** gain a `scope` member. Instead `backend-toolkit-next` exposes a generic `postValidationGuard?: (ctx) => void \| Promise<void>` on the route options. Two reasons the original was wrong: (a) putting `scope` in the ODM-agnostic *core* auth type coupled it to Next's request/validation timing; (b) more seriously, a guard that reads ownership and then hands off to a handler that re-queries is a **preflight check, not authorization** — ownership can change in between (TOCTOU). So the guard is documented as a **fast-fail UX and defence-in-depth layer only**, and the binding rule is that authorization-relevant ownership **must appear in the handler's own query filter or be re-checked inside the mutation's transaction**. See [07](07-authorization-roles-permissions.md). |
| `TransactionAbortedError` | 500, `TRANSACTION_ABORTED` — [05](05-transactions-and-data-integrity.md) |
| `TooManyRequestsError` (429), `UnprocessableEntityError` (422) | The 13 existing classes have no 429 or 422; the app's rate limiter currently has no error class to throw. |
| `AuditEventPayload` + `AuditWriter` interface | The *contract* only — a `write(payload)` interface the app implements. The package never decides what is audited. |
| `ActorContext` interface | `{userId, organizationId?, roleNames, permissions}` — the shape `createdBy`/`updatedBy` and audit both consume. |
| `FindCriteria.session` doc updated | to state that an ambient session may supply it |

Semver: minor. `RouteAuthOption` gains a union member — additive for every
existing call site.

### 3. `backend-toolkit-mongoose` 0.3.3 → 0.4.0 — the largest change

| Addition | Detail |
|---|---|
| **`withTransaction` + `getActiveTransaction` + `TransactionContext`** | Full design in [05](05-transactions-and-data-integrity.md). `AsyncLocalStorage`-based ambient session, reentrant, poison-on-swallowed-error, retry on transient errors, `onCommit`/`onAbort` hooks. |
| `resolveSession()` wired into all 18 session call sites | `criteria.session ?? ambient ?? undefined`. Fully backward compatible. |
| **Two repository factories — reworked after review** | `createScopedRepository` reads `organizationId` from the ambient request context and `$and`-combines it into every `where`, with **no opt-out of any kind**; `createGlobalRepository` is unscoped and importable only from `core/bootstrap/**`, `migrations/**` and `scripts/**`. The original single factory with a `skipOrganizationScope: true` criterion was rejected — a caller-controlled boolean is not a tenant boundary. Scoped writes stamp `organizationId` from context, reject a mismatch, and strip it from every patch. Uses the existing `combine-filters.ts`, which already `$and`s rather than spreading. See [06](06-organization-and-branches.md). |
| **`PopulateNode.match`** | Populate is entirely unscoped today — verified, `execute-find-query.ts:28` passes each node straight to Mongoose and `PopulateNode` carries only `{path, model, select?, populate?}`. `buildRelationTree` stamps the tenant predicate on every node at every nesting depth; a tenant-owned populate node without a match is a build-time error. This closes a real cross-organization read path. |
| **`@Index()` decorator** | Explicit, with compound support. |
| ~~`@Filterable()`/`@Relation()` auto-index~~ | **Dropped entirely after review.** The opt-in flag was still the wrong abstraction: "filterable" is an API capability, indexing is a workload property, and a single-field index on a low-cardinality enum usually loses to a compound index over `(organizationId, status, date)` matching the real sort. `@Relation` likewise does not imply a useful standalone index. Only `@Index()` ships, and [04](04-domain-model.md)'s index plan declares every index explicitly — which is the correct fix for L7 anyway. |
| `@CreatedBy()` / `@UpdatedBy()` | Populated from an `ActorContext` resolver **with an explicit override**. Auto-population from ambient state alone was wrong: imports, migrations, system jobs and impersonation have either no request actor or two (effective and originating). So the decorator reads the ambient actor as a *default*, accepts an explicit actor on the write, and — per app policy — rejects an unexplained absence rather than writing `null`. |
| `aggregate(pipeline, options)` | **Relabelled after review: a raw, session-aware, explicitly UNSCOPED primitive**, available only on the *global* repository. The original claim that a prepended `$match` made it "scope-aware" was false comfort — `$lookup`, `$unionWith`, `$graphLookup` and nested pipelines read other collections independently and a root match does nothing for them. Request-path aggregates must use explicitly scoped builders that inject the tenant predicate into **every** participating collection. The four reporting builders (count-by-period etc.) are **dropped from the package** — date bucketing, timezone and status semantics are reporting concerns and stay app-local until a second consumer exists. |
| `updateMany`, `deleteMany`, `bulkWrite` | Currently only `save(entities, {strategy:"insertMany"})` exists. Migrations need the rest. |
| ~~`AuditEvent` schema factory~~ | **Dropped after review.** Only the narrow `AuditWriter` interface (in `backend-toolkit-core`) is genuinely generic. Actor shape, subject identifiers, redaction rules, before/after payloads, retention, tenant partitioning and any integrity chaining all vary too much to freeze in a package with one consumer. The **schema and repository stay app-local** in `core/audit/` until a second product proves commonality. |
| ~~`syncPermissions` gains deactivation~~ | **Dropped after review.** `syncPermissions` runs at **every server boot** — verified, `nutrition-staff/src/instrumentation.ts:33` calls it inside `register()`. A deactivation pass would therefore fire destructively on every cold start, and during a rolling deploy an old instance's registry would deactivate the new instance's keys. It stays **insert-only, permanently**. Permission deactivation becomes an explicitly-invoked, version-gated **app migration** ([20](20-migration-strategy.md) R4), never a startup behaviour. |

Semver: minor (0.x convention). Nothing existing breaks; `session` behaviour is
additive.

### 4. `backend-toolkit-next` 0.4.1 → 0.5.0

| Addition | Detail |
|---|---|
| **Step 6.5: post-validation authorization** | If `auth.scope` is present, invoke it after `validateRouteInputs` and before the handler. Permission checking stays at step 4, preserving the current 401/403-before-400 ordering. This is a change to the documented fixed 9-step sequence and is the most carefully reviewed item in the wave. |
| Request-context hook | `configureNextBackendToolkit({ requestContext: { resolve } })` — the factory opens an ambient context around the handler. Serves both the actor context and the organization context. |
| `RouteHandlerContext` gains `requestId` | For audit correlation; nothing today has one. |
| Rate-limit option | Optional per-route, throwing the new `TooManyRequestsError`. The app's in-memory limiter stays app-local (its own comment says replace it if the deploy goes multi-instance). |

Deliberately **not** added: a `transaction: true` route option. Wrapping every
request in a transaction would put reads in transactions and revalidation inside
the transaction boundary. Transaction boundaries belong to the domain operation.

Semver: minor.

### 5. `backend-toolkit-cloudinary` 0.1.2 → 0.2.0

| Addition | Detail |
|---|---|
| `uploadDocument(buffer, {folder, mimeType, filename})` → `DocumentAsset` | **Corrected after review: `raw` is not a synonym for "document".** Cloudinary treats PDFs as `image` for transformation and preview purposes while other files are `raw`, and delivery *and destruction* both need the exact resource type, delivery type, format and version. So the provider decides and **persists** the resource type per upload rather than assuming `raw`. |
| **A download-grant API, not a "signed URL"** | **Corrected after review.** An ordinary signed Cloudinary delivery URL proves authenticity; it is **not** inherently time-limited. Expiry requires the private-download / token-authenticated mechanism, which is a different API. So the contract is `createDownloadGrant(locator, { expiresInSeconds })` — deliberately not named `getSignedUrl`, because the original name encoded the confusion. Upload uses an access-controlled delivery type. |
| `DocumentAsset` shape — **reworked** | Was `{provider, publicId, url, format, bytes, pageCount?}`. **Persisting a `url` was wrong**: a private URL must be *generated per request*, never stored, or the stored value is either permanently valid or permanently stale. New shape: `{ provider, assetKey, mediaKind, accessPolicy, resourceType, deliveryType, version, format, mimeType, bytes, checksum, originalFilename, pageCount? }` — an opaque provider locator plus metadata, and no delivery URL at all. |
| `destroyAsset` accepts the full locator | Not just `(publicId, resourceType)` — destruction needs delivery type and version too. |

**This closes the current access-control flaw, and it is a blocker for the
clinical-document feature.** Today every asset is a permanent public `secureUrl`
with no access control, so a leaked URL is permanent unauthenticated access to a
patient document. No document feature ships before this lands.

**It does not, by itself, make the system compliant for healthcare data.**
Signed private delivery addresses confidentiality of the delivery path. Provider
suitability for patient data is deployment- and jurisdiction-dependent and turns
on data residency, the contractual/DPA position, retention and deletion
including from backups, provider-side access logging, backup arrangements,
encryption and key custody, and the customer's regulatory regime — none of which
a package release can settle. See [08](08-platform-foundation.md) for the full
statement and [25](25-risks-and-open-decisions.md) D1.

The design commitment here is narrow and deliberate: implement private,
grant-based delivery, and **keep the `AssetProvider` abstraction clean so
Cloudinary can be replaced where a customer requires it.** No Cloudinary-specific
type may reach `platform/`.

**And the review found that abstraction is already leaking.** `publicId`,
`resourceType`, a canonical `url`, and Cloudinary's delivery-type vocabulary all
mirror one provider; swapping in S3 would mean translating those semantics
through stored data and every cleanup path. So `backend-toolkit-core`'s
`AssetProvider` is generalised in the same release: `assetKey` instead of
`publicId`, an opaque `providerData` bag for provider-specific fields,
`mediaKind` instead of `resourceType`, an `accessPolicy`, and
`createDownloadGrant()` as a first-class provider method rather than a
Cloudinary-shaped afterthought. Verified: the current interface
(`backend-toolkit-core/src/asset/asset-provider.interface.ts:17`) can only upload
image/video and destroy by `(publicId, resourceType)` — it genuinely cannot
express private delivery, so this is a required change and not a nicety.

## Wave A-frontend

### 6. `frontend-toolkit-core` 0.5.1 → 0.6.0

| Addition | Detail |
|---|---|
| `usePermissions()` → `{can, canAll, canAny, user}` | The hook that does not exist. `nutrition-staff/src/common/auth/use-permissions.ts` is the app-local wrapper any second app would re-invent. |
| `useCan(permission)` | Convenience. |
| `hasPermission`/`ResolvedRole` re-exported from `toolkit-common` | Removes the front/back duplication. |
| `AuthSession` provider | The type exists today with **no provider implementing it**. Implement it, or delete the type. Implementing it. |
| Endpoint helpers for action-style routes | `POST /:id/sign`-shaped endpoints, which the appointment and encounter modules use heavily. |

Requires a peer bump in `frontend-toolkit-tailwind` (its range stops at `^0.5.0`).

### 7. `frontend-toolkit-tailwind` 0.11.0 → 0.12.0

| Addition | Detail |
|---|---|
| ~~`CalendarView`~~ | **Removed from wave A after review — see the Calendar decision below.** No calendar component ships in a shared package in this programme. |
| **`CommandPalette` — narrowed after review** | The toolkit owns the **accessible shell only**: the `cmdk`-based dialog, focus and keyboard semantics, grouped-item rendering, and an `items`/`onSelect` API. The **app** owns the action registry, shortcut-conflict management, async multi-source orchestration, permission filtering and recent/pinned persistence — all of which are application-shell policy, not a primitive. The original scope bundled the two. |
| `DateRangePicker` | — |
| Table filters | `DATE_RANGE`, `NUMBER_RANGE`, `MULTI_SELECT`, `BOOLEAN`, `TEXT_CONTAINS` — closing the gap to the backend's 13 existing `FilterOperator`s, which have had no UI counterpart. |
| `TableColumn.priority` | Drives responsive card collapse; `CustomTable` has no column-priority support today, so a 10-column table can only scroll horizontally. |
| `MoneyInput` / `MoneyText` | On `toolkit-common`'s `Money`. |
| `TagInput` | The app hand-rolls comma-separated strings. |
| `FormFieldArray` + `FieldType.FIELD_ARRAY` | The app hand-rolls `array-field-editor.tsx`, which keys rows by index — a latent bug its own sibling file (`sortable-list.tsx`) documents and deliberately avoids. |
| `FieldType.PASSWORD` | The app's `password-input.tsx` already rebuilds this on `CustomInput`'s `endControl` slot; promote it. |
| `Breadcrumbs` | None exist anywhere; 44 literal `backRoute` props are the substitute. |
| `Avatar`, `AvatarGroup`, `Tooltip`, `Popover`, `Accordion`, `Stepper`, `SegmentedControl`, `ProgressBar` | Ordinary primitives, all absent. |
| `StatusBadge` | Icon + label + variant + **`size`**. `Badge` has neither an icon slot nor a size. |
| `SortableList` | Promoted from the app, which pulls in three `@dnd-kit` packages solely for it, and whose own doc comment says no toolkit equivalent exists. |
| `StarRating` | Promoted from the app — keyboard- and RTL-correct, and already the app's only tested component. |
| **`Timeline` RTL fix** | Physical `border-l` / `pl-6` / `-left-[29px]` → logical properties. A correctness fix. |
| Density + motion token roles | Extends `ROLE_DEFAULTS` — [17](17-ux-architecture-and-design-system.md), [18](18-motion-system.md). |

Semver: minor. Additive, plus one RTL behaviour fix (which is a fix, and
`nutrition-client` uses `Timeline` zero times).

**Also in this wave, app-side and requiring no package change:** migrate
`nutrition-staff`'s **147 root-barrel imports** to the 16 granular entry points.
`tsup.config.ts:20-45` records the measured cost as **93 kB First Load JS** per
barrel import, and zero staff files currently use `/table`, `/forms`, `/inputs`,
`/charts` or `/primitives`. Pure mechanical rewriting, highest value-to-effort
ratio in the programme.

## The calendar decision — reversed after review

The first draft proposed building a generic `CalendarView` in
`frontend-toolkit-tailwind`, justified on RTL correctness and the `--ftk-*` token
contract. **Both halves of that justification were wrong or weak, and the
conclusion is reversed.**

- **"No candidate handles RTL" was factually false.** FullCalendar supports RTL
  and resource views; React Big Calendar has an `rtl` option; DayPilot and
  Mobiscroll support RTL and resource scheduling; Schedule-X supports
  configurable views. The real trade-offs are licensing, styling effort,
  accessibility depth and resource-timeline capability — not RTL.
- **The token argument was backwards.** CSS variables can theme a third-party
  component through a wrapper and scoped overrides. Owning layout algorithms
  forever to preserve `--ftk-*` naming is a bad trade.
- **It is not a primitive; it is a product.** Day/week/month, resource lanes,
  absolute layout, drag and drop, keyboard navigation, RTL, responsive
  degradation, overlap columns, minimum event height, cross-midnight and all-day
  events, DST discontinuities, virtualization across many resources, pointer
  capture, auto-scroll while dragging, keyboard drag alternatives, screen-reader
  announcements, locale week starts, print — the first draft named perhaps a
  third of that surface.
- **Putting the first implementation in a shared package freezes an unproven
  API** — which is exactly what `.claude/skills/toolkit-first-development/SKILL.md`
  forbids: real, identified reuse, never hypothetical.

**Revised plan:**

1. **Phase 6 runs a bake-off** before writing scheduling UI: FullCalendar
   (Scheduler, if the licence is acceptable), Schedule-X, React Big Calendar
   plus a resource view, and DayPilot Lite — evaluated against explicit fixtures
   for Arabic/RTL, a DST transition day, 6+ practitioner lanes, 375px, and
   keyboard/screen-reader operation.
2. **The scheduling UI is built app-local** in `platform/appointments/`,
   whichever way the bake-off goes — either a themed adapter around a library or,
   if every candidate genuinely fails the fixtures, a bespoke view that is
   honestly scoped rather than optimistically scoped.
3. **Extraction to the toolkit is deferred** to wave B or later, and only on the
   real criterion: a second consumer, or a stable interface proven by use.

This also removes `CalendarView` from the wave-A critical path, which shortens
the gate in front of Phase 6.

## Wave B (Phase 11)

`frontend-toolkit-tailwind`: CSV export from `FeatureTable`; saved views if the
app-local implementation proves genuinely generic; virtualization if a real list
demands it. `backend-toolkit-mongoose`: further aggregation builders driven by
what the reporting phase actually needed.

Wave B is deliberately thin, and specified from evidence produced by Phases 2–10
rather than guessed now.

## Release sequencing

**Split by invariant after review.** The first draft's wave A-backend bundled
transaction semantics, tenancy scoping, auditing, indexing, aggregation, bulk
writes, actor stamping and permission lifecycle into one
`backend-toolkit-mongoose` release. When something regressed there would be no
way to attribute or roll back the cause. Wave A-backend is now three releases of
that package, each with one invariant and its own consumer verification:

| Release | Invariant | Contains |
|---|---|---|
| `backend-toolkit-mongoose` **0.4.0** | *Transactions work* | `withTransaction`, rollback-only, `tx.complete`, hooks, `resolveSession` through all 18 call sites, session-identity guard |
| **0.5.0** | *Tenancy cannot leak* | scoped/global repository split, `PopulateNode.match`, write-side stamping and immutability, per-method invariant tests, the operation matrix |
| **0.6.0** | *Everything else* | `@Index()`, `@CreatedBy`/`@UpdatedBy` with explicit override, raw `aggregate()`, `updateMany`/`deleteMany`/`bulkWrite` |

0.5.0 does not ship until 0.4.0 is exercised in the app. This lengthens the gate
in front of Phase 3 and is worth it — a tenancy leak found three releases later
is not attributable.


```
Wave A-backend                        Wave A-frontend
  toolkit-common 0.5.0  ─────────────────────┐
        │                                    │
        ├─ backend-toolkit-core 0.5.0        ├─ frontend-toolkit-core 0.6.0
        │        │                           │        │
        │        ├─ backend-toolkit-mongoose 0.4.0     └─ frontend-toolkit-tailwind 0.12.0
        │        └─ backend-toolkit-next 0.5.0                  (peer bump to core ^0.6)
        └─ backend-toolkit-cloudinary 0.2.0

  unblocks Phases 3, 4, 5, 10           unblocks Phases 2, 6
```

Deepest first, one at a time, each verified in a real consumer against a packed
tarball before the next begins. `toolkit-common` 0.5.0 is shared by both waves
and ships once, first.

**Per-release checklist**, from `.claude/skills/shared-package-change/SKILL.md`:

1. `git checkout -b staging` if the repo lacks it (the four backend toolkits do).
2. Implement; `npx tsc --noEmit`; `npm test`.
3. `npm run build && npm pack`.
4. Install the tarball into `nutrition-staff` (and `nutrition-client` for
   `toolkit-common`); build and exercise the consumer.
5. Revert the consumer's `package.json` and lockfile; delete the `.tgz`.
6. Codex review of the contract change.
7. Registry preflight: `npm whoami --registry=https://npm.pkg.github.com`.
8. Version bump, then publish — **each an explicitly requested act**.
9. Update consumer ranges from the registry.

## What must never enter a toolkit

- `CacheTag` strings and `CACHE_POLICY` intervals. **Proposed twice and rejected
  twice.** Not re-proposed here.
- Every `domain/*.ts` type; `PublicApiRoute`'s route strings;
  `publishRevalidation`'s HTTP implementation.
- Any nutrition, patient, encounter, invoice or clinic concept. The test stays:
  *could an unrelated project use this without knowing what a patient is?*
- The Patient Clinical Banner, the waiting board, the encounter workspace, vitals
  entry, diagnosis or prescription UI, the invoice line editor, clinical severity
  mappings, appointment status visuals, role home screens.
- Organization/tenant *semantics*. The scope-injection **mechanism** is generic;
  the concept of a clinic is not.
- Notification delivery, saved-view persistence, and recurrence policy.

## Risks

| Risk | Mitigation |
|---|---|
| Step 6.5 changes the route factory's documented fixed sequence — every route in both apps depends on it | The most heavily tested item in the wave: assert ordering (401 → 403 → 400 → scope → handler) and that a route without `scope` is byte-identical in behaviour. Codex review before implementation. |
| `toolkit-common` is used in 33 `nutrition-client` files; a mistake there breaks the public website | Verify against **both** consumers via tarball before publishing. `nutrition-client` needs no version bump for these additions. |
| The 0.x-minor-is-breaking convention makes every wave look breaking to a reader | Each release's consumer impact is stated explicitly in the tables above. |
| Peer-range drift: tailwind's core range stops at `^0.5.0` | Bumped in the same wave, in order. |
| `AsyncLocalStorage` is unavailable in the Edge runtime | Every route in this app is Node runtime. `withTransaction` throws `ConfigurationError` rather than silently losing context. |
| Auto-indexing `@Filterable` would add write amplification to existing deployments | Opt-in flag, not a default. Explicit indexes per [04](04-domain-model.md). |
| ~~A calendar built in-house is a large surface to own~~ | **Resolved by reversing the decision** — no calendar ships in a package; a bake-off precedes an app-local implementation. |
| Wave A-backend bundled too many invariants into one `backend-toolkit-mongoose` release to attribute a regression | Split into 0.4.0 (transactions) → 0.5.0 (tenancy) → 0.6.0 (everything else), each verified in the app before the next. |
| `bigint` `Money` is not JSON-native and crosses the API boundary | Explicit `toMoneyJson`/`fromMoneyJson`; DTOs carry the serialized form, never a raw `bigint`. Tested at the route boundary. |

## Acceptance criteria

- [ ] Every package: `tsc --noEmit` clean, tests green, `npm pack` verified in a
      real consumer before publish.
- [ ] `nutrition-client` builds and its 18 public endpoints are unchanged after
      the `toolkit-common` release.
- [ ] No route's existing auth behaviour changes when `scope` is absent.
- [ ] `hasPermission`/`ResolvedRole` defined once.
- [ ] `Timeline` mirrors correctly under RTL, verified by measured element
      positions.
- [ ] `CommandPalette` ships as an accessible shell only — no registry, no
      persistence, no permission logic in the package.
- [ ] No calendar component exists in any shared package.
- [ ] `AssetProvider` exposes `createDownloadGrant`, and no stored asset record
      contains a delivery URL.
- [ ] `syncPermissions` is still insert-only.
- [ ] `aggregate()` is documented as unscoped and is unavailable on the scoped
      repository.
- [ ] `Money` uses `bigint` with an ISO 4217 exponent table; no formatting or
      free-text parsing ships in `toolkit-common`.
- [ ] Staff's root-barrel imports migrated; the First Load JS reduction measured
      and recorded.
- [ ] Every backend toolkit has a `staging` branch and nothing was merged to a
      default branch.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict: FATALLY FLAWED (over-generalization). Substantially rewritten.**

This was the document the review damaged most, and correctly — roughly a third of
the proposed package surface was this product's needs dressed as generic
capability.

| # | Finding | Sev | Analysis | Resolution |
|---|---|---|---|---|
| 1 | `RouteAuthOption.scope` is a **preflight check, not authorization** — ownership can change between the guard's read and the handler's write (TOCTOU). | CRITICAL | Correct, and the most important finding here. The first draft presented it as the answer to resource-scoped authorization; it is only a fast-fail layer. | **Accepted.** Renamed to a generic `postValidationGuard` on the *Next* package (not core), documented as defence-in-depth, with the binding rule that ownership must be in the handler's query filter or re-checked inside the mutation's transaction. |
| 2 | The claimed "401 → 403 → 400" ordering is imprecise: with a post-validation guard, a user holding the coarse permission but lacking scope gets 400 for malformed input before the guard can 403. | MAJOR | Correct. Only *coarse-permission* 403 precedes 400. | **Accepted.** Documentation corrected in [07](07-authorization-roles-permissions.md); the 404-vs-403 disclosure question is decided explicitly there. |
| 3 | `scope` in a generic auth type couples ODM-agnostic core to Next's validation timing. | MAJOR | Correct. | **Accepted.** The hook lives in `backend-toolkit-next`. |
| 4 | `AuditWriter` as a narrow interface is generic, but the `AuditEvent` **schema factory** is premature. | MAJOR | Correct. Actor shape, redaction, retention and partitioning all vary. | **Accepted.** Interface in core; schema and repository app-local. |
| 5 | Audit writes must not depend on ambient actor state alone — jobs, migrations and impersonation have no request actor or two actors. | MAJOR | Correct. | **Accepted.** Explicit actor on the command, ambient only as a default; unexplained absence rejected. |
| 6 | `aggregate()` with a prepended tenant `$match` makes a **false safety promise** — it cannot scope `$lookup`, `$unionWith`, `$graphLookup` or nested pipelines. | CRITICAL | Correct, and the original wording ("cannot be omitted") was actively misleading. | **Accepted.** Relabelled raw and unscoped, global-repository only; scoped builders required on the request path. |
| 7 | Four reporting builders do not belong in a repository factory — they embed bucketing, timezone and status semantics. | MAJOR | Correct. | **Accepted.** Dropped from the package; app-local. |
| 8 | `CommandPalette` is over-generalized: async multi-source search, registries, shortcut conflicts and permission filtering are shell policy. | MAJOR | Correct. | **Accepted.** Narrowed to the accessible shell plus an item API. |
| 9 | `Money` is underspecified: non-2-decimal currencies, safe-integer limits, rounding modes; `parseMoney` is dangerous as a generic API. | MAJOR | Correct on every point. | **Accepted.** `bigint`, ISO 4217 exponent table, explicit rounding modes; `formatMoney`/`parseMoney` removed from `toolkit-common`. |
| 10 | `formatMoney` in `toolkit-common` mixes `Intl` presentation with arithmetic and complicates serialization. | MAJOR | Correct. | **Accepted**, as above, plus explicit JSON codecs for `bigint`. |
| 11 | `@Filterable` auto-indexing is a bad abstraction even behind an opt-in. | MAJOR | Correct — and this reverses a position the doc had already argued for once. Filterability is an API property; indexing is a workload property. | **Accepted.** Dropped entirely; only `@Index()` ships. |
| 12 | `@CreatedBy`/`@UpdatedBy` tied to an ambient resolver hides mutation semantics for imports, jobs and impersonation. | MAJOR | Correct. | **Accepted.** Explicit override, ambient as default. |
| 13 | Deactivation in `syncPermissions` is unsafe as a startup sync — absence in one running version's registry becomes a destructive write during a rolling deploy. | MAJOR | Correct, and **verified**: `src/instrumentation.ts:33` calls it at every boot. | **Accepted.** Dropped from the package; deactivation is an explicit app migration ([20](20-migration-strategy.md) R4). |
| 14 | Interval arithmetic, wall-clock helpers, the missing HTTP error classes, explicit compound indexes and the asset-contract improvements are genuinely generic — but should ship independently. | — | Agreed. | **Accepted.** Release split by invariant. |
| 15 | The wave is too broad to attribute a regression causally. | MAJOR | Correct. | **Accepted.** `backend-toolkit-mongoose` split into three releases, each with one invariant. |

**From Area 8 (Cloudinary), also accepted:** a signed URL is not inherently
expiring (renamed to `createDownloadGrant`); `raw` is not a synonym for document
(PDFs are `image` in Cloudinary); `DocumentAsset` must not persist a delivery
URL; the current `AssetProvider` genuinely cannot express private delivery and is
generalised; and post-issuance sharing is a real limit mitigated by very short
TTLs, `Cache-Control: private, no-store` on the granting route, and audited
grants.

**From Area 9 (calendar), accepted in full and the decision reversed** — see the
calendar section above.

**Rejected:** nothing material. The one place I pushed back is finding 7 in Area
4 (the vertical registry) — see [12](12-vertical-extension-model.md) — where the
suggestion to collapse to typed collections per specialty would defeat the
product requirement that makes this sellable outside nutrition.
