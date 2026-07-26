# Nutrition Backoffice + Backend: Implementation Plan (v6 — APPROVED)

**Status: approved for implementation.** Final decisions below are incorporated into the plan; implementation proceeds phase by phase, starting with Phase 1 only. Nothing is published, committed, or pushed without separate approval at each step.

## Final decisions (incorporated)

1. `AuthUser`/`ResolvedRole`/`hasPermission` stay **out** of `toolkit-common` — not currently cross-imported, and consolidating security-sensitive auth contracts is outside this migration's scope.
2. Upload-on-submit is kept for video. Production deployment target isn't finalized (likely Vercel initially, possibly a self-managed server later) — **uploaded-video support must be verified against the actual hosting platform's body-size/request limits before that part of Phase 2 is implemented.** Images proceed exactly as designed, no caveat.
3. A published Campaign **may** be set as `activeCampaignId` before its own `startDate`. The **public** active-campaign endpoint additionally filters on the current time being within `[startDate, endDate]` — pre-activation is allowed at the data layer, but public visibility stays date-gated. (Updates §9.)
4. All four exclusions confirmed deferred: Resources, Newsletter, dynamic navigation, Leads.
5. Cloudinary confirmed. `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` are already set as environment variables in the project. `backend-toolkit-cloudinary` stays **provider-only and configuration-agnostic** — it receives cloud name/key/secret (and any folder naming) from the consuming app's own config at call time; no credentials, folder names, or nutrition-specific values are ever hardcoded or embedded inside the package itself.
6. **New dependency rule:** `nutrition-staff/package.json` declares a toolkit package as a direct dependency **only if its own source code directly imports from that package** — never merely because it's somewhere in the transitive graph. This must be verified against actual `nutrition-staff` imports before finalizing its `package.json`, not assumed from the dependency graph shape.

---

## Evaluation of your 10 points (verified against the real repos, not assumed)

| # | Topic | Decision | Basis |
|---|---|---|---|
| 1 | Currency placement | **Reversed: Option A, app-level in nutrition-staff** | See §0.1 — fails the two-consumer admission rule; the codebase's own precedent for this exact shape (`Status`, `EntityName`) already lives app-level, not toolkit-level |
| 2 | Explicit publish/upgrade order + bump sizes | **Adopted, with per-package bumps smaller than v5 assumed** | See §0.3 — real cross-import scope is much narrower than v5 assumed once verified |
| 3 | Split migration from new-feature work into two phases | **Adopted as-is** | Clean, verifiable checkpoints; no reason not to |
| 4 | Strengthen toolkit-common admission rule | **Adopted, sharpened further** | See §0.1 — the real test is "does frontend-toolkit-core's or backend-toolkit-core's *own* generic code need this," not "is it shared between nutrition-staff's frontend and backend" (which needs no toolkit package at all — same repo) |
| 5 | frontend-toolkit-tailwind dependency shape | **Re-export through frontend-toolkit-core (not a direct toolkit-common dependency)** | See §0.4 — verified 53/53 existing imports already go through the bare `frontend-toolkit-core` specifier, zero direct `/common` subpath imports; a new direct dependency would break an unbroken existing convention for no benefit |
| 6 | Campaign Builder architecture | **Adopted, with one concrete resolution your own question flagged as open** | See §7 — block-level *routes*, whole-document *repository writes* underneath (no repository-layer change needed — see verification) |
| 7 | Campaign asset lifecycle | **Adopted — composes directly from §2's existing rules, no new concept needed** | See §7.4 |
| 8 | Implementation checkpoints | **Adopted** | See Implementation Order |
| 9 | Verify version bumps package-by-package | **Adopted — see the real, narrower scope in §0.3** | Verified via git log + grep, not assumed |
| 10 | Preserve strong v5 parts | **All retained unchanged** — confirmed below | No repository evidence contradicted any of them |

---

## Context (unchanged)
`nutrition-client` is a module-discovery reference only. `nutrition-staff` hosts both the admin UI and its own backend. Nothing here is implemented, published, committed, or pushed yet.

---

## Guiding principles
1. Content vs. UI chrome.
2. Bilingual by evidence.
3. Design for v2, not parity with nutrition-client's static-JSON accidents.
4. **A symbol enters `toolkit-common` only if it has real cross-boundary usage today, or is required to define an agreed cross-boundary wire/data contract between toolkit packages themselves** — never because it's merely used by both nutrition-staff's own frontend and its own backend, since those live in one repo and need no shared package for that at all.
5. Nutrition-specific concepts never enter any toolkit package.
6. Follow the existing Users/Roles reference pattern.

---

## 0. `toolkit-common`: verified migration scope

### 0.1 The admission rule, applied to every proposed export

The tightened rule from your point 4, applied honestly to each candidate:

| Symbol | Classification | Verdict |
|---|---|---|
| `SortOrder` | **Existing real cross-boundary usage** — `backend-toolkit-core`'s own `BaseFindQueryDto`/`RepositorySort` and `backend-toolkit-mongoose`'s own `build-sort.ts` import it directly today | toolkit-common |
| `PaginatedResponse<T>` | **Existing real cross-boundary usage** — `backend-toolkit-mongoose`'s own repository interface (`findAllAndCountPublic`) returns it | toolkit-common |
| `PaginationQuery` | No proven current cross-import (grep found none) — classified as **required shared wire contract** instead (a pagination query shape both a generic API client and a generic backend base DTO should agree on), weaker evidence than the two above, flagged honestly | toolkit-common, lower-confidence |
| `Dictionary<T>` / `Nullable<T>` | No proven current cross-import either way found; pure generic utility types, pre-existing in the already-designated shared subpath before this refactor | toolkit-common (grandfathered, not re-litigated) |
| `ApiError`/`ApiValidationError` | No backend package imports this today — but `backend-toolkit-next`'s `ErrorResponseBody` carries a doc comment stating it's "wire-compatible with" `ApiError`. Classified as **required shared wire contract**, formalizing an already-intended-but-informally-enforced alignment, not "proven usage" | toolkit-common |
| `Localized<T>`, `isLocalizedComplete`, `findIncompleteLocalizedPaths` | **Required shared contract** — genuinely needed by `backend-toolkit-mongoose`'s own `localizedStringField()` schema helper AND `frontend-toolkit-tailwind`'s own `LOCALIZED_INPUT` field type, both real toolkit-level capabilities (not nutrition-specific — this is the actual "bilingual support added generically to the toolkit" the original request asked for) | toolkit-common |
| `ImageAsset`, `VideoAsset`, `AssetProviderType` | **Required shared contract** — needed by `backend-toolkit-cloudinary`, `backend-toolkit-mongoose`'s schema helpers, and `frontend-toolkit-tailwind`'s upload components | toolkit-common |
| `UploadPolicy` (shape) | **Required shared contract** — needed by `backend-toolkit-next`'s `validateUploadedFile()` and `frontend-toolkit-tailwind`'s client-side pre-check | toolkit-common |
| `UploadMode` | **Weakest case, kept as an explicit exception.** Only `ON_SUBMIT` has a real consumer; `IMMEDIATE` has none. This doesn't fully satisfy the rule on its own merits — kept only because you explicitly directed it as deliberate, low-cost future-proofing in the immediately preceding turn, not because I'm proposing new scope here | toolkit-common, flagged exception |
| `Currency` | **Fails the rule.** Neither `frontend-toolkit-core`'s nor `backend-toolkit-core`'s own generic code needs a currency concept for its own operation — it's purely nutrition-staff's own domain vocabulary. Since nutrition-staff's frontend and backend already live in one repo, sharing this type between them needs **no toolkit package at all**. The codebase's own precedent for this exact shape (a small, closed, `@IsEnum`/Mongoose-`enum`-validated set specific to one app) is `Status` and `EntityName` — both live in `nutrition-staff/src/common/`, not in any toolkit package, despite being validated identically to how `Currency` would be | **nutrition-staff, app-level** (reversed from v5) |

### 0.2 What actually crosses the boundary today (verified, not assumed)
Grepping every backend package's source for `frontend-toolkit-core` imports found exactly:
- `SortOrder` — `backend-toolkit-core/src/dto/base-find-query.dto.ts`, `repository/repository-sort.interface.ts` (+tests); `backend-toolkit-mongoose/src/repository/query/build-sort.ts` (+tests).
- `PaginatedResponse<T>` — `backend-toolkit-mongoose/src/repository/create-mongoose-repository.ts`, `mongoose-repository.interface.ts`.
- `backend-toolkit-next` has **zero real imports** — only a stale peer-dep declaration and a docstring comment. Removing it is a no-op code-wise.

Critically, `frontend-toolkit-core/src/index.ts` **already re-exports every `./common` symbol at its root** (`export * from "./common/sort-order.enum"`, etc., alongside `export * from "./api/api-error.interface"` directly) — meaning `frontend-toolkit-tailwind` and `nutrition-staff` (both confirmed to only ever import the bare `@kira-joo/frontend-toolkit-core` specifier, never the `/common` subpath — see §0.4) see **no breaking change at all** from this migration. The only confirmed consumers of the `/common` subpath specifically are `backend-toolkit-core` and `backend-toolkit-mongoose`. This narrows the real migration to: move the ~6 files behind `frontend-toolkit-core`'s `./common` subpath into `toolkit-common`; update `frontend-toolkit-core`'s own internal imports (its `normalize-error.ts`, `is-api-error.ts`, etc. currently import `ApiError` via a local relative path, not the `/common` subpath — these switch to importing from `@kira-joo/toolkit-common`); keep re-exporting everything at `frontend-toolkit-core`'s root (so its public surface for bare-specifier consumers is unchanged); remove the `./common` export map entry from `package.json`; update the 5 real import sites in `backend-toolkit-core`/`backend-toolkit-mongoose`; drop the stale peer-dep line in `backend-toolkit-next`.

### 0.3 Version bumps and publish order (verified against real history, not assumed)

No versioning policy is documented anywhere in any of the 5 repos (confirmed: no CHANGELOG, no CONTRIBUTING/RELEASING doc, no changesets/semantic-release config in any of them). Historical bumps are manual and inconsistent (e.g. `backend-toolkit-core`'s own "Replace flat role-string auth..." got a minor bump, while `frontend-toolkit-core`'s "...replace the permission model" only got a patch-style bump). In the absence of a documented policy, this plan adopts one explicit rule for this refactor: **since every package is pre-1.0, and npm's own caret-range semantics already treat the minor digit as the effective compatibility boundary for `0.x.y` (`^0.3.3` excludes `0.4.0` exactly the way `^1.3.3` excludes `2.0.0`), a breaking change bumps MINOR; additive/non-breaking work bumps PATCH.**

| Package | Change | Bump | Why |
|---|---|---|---|
| `toolkit-common` | New package | `0.1.0` initial | Matches every other repo's own starting point |
| `frontend-toolkit-core` | Removes the `./common` export map entry (breaking, but only for its 2 confirmed subpath consumers); internal implementation now sources shared types from `toolkit-common` (invisible to consumers, since root re-exports are unchanged) | **0.3.3 → 0.4.0 (minor)** | Public subpath removal is a real breaking change for its actual consumers |
| `backend-toolkit-core` | Peer-dep swap (`frontend-toolkit-core` → `toolkit-common`); its own exported types (`BaseFindQueryDto.sortOrder`, etc.) now structurally reference a symbol from a different package | **0.2.0 → 0.3.0 (minor)** | A consumer who also directly imports `SortOrder` separately must update that import too — a real, if narrow, breaking surface |
| `backend-toolkit-mongoose` | Same reasoning (imports `SortOrder`/`PaginatedResponse`) | **0.1.4 → 0.2.0 (minor)** | Same as above |
| `backend-toolkit-next` | Drops an unused peer-dep declaration; **zero actual code ever imported anything real from `frontend-toolkit-core`** | **0.2.0 → 0.2.1 (patch)** | Verified nothing breaks — this is dependency-declaration hygiene only |
| `frontend-toolkit-tailwind` | **No change required for this migration at all** — confirmed zero `/common` imports; its 53 existing imports all go through the stable bare `frontend-toolkit-core` specifier | **No bump in Phase 1** | It picks up a natural bump later, in Phase 2, when the new upload components are actually added — unrelated to this dependency cleanup |
| `nutrition-staff` | Not published; update `package.json` ranges for the 4 bumped packages + add `toolkit-common`; **no source import-statement changes required** (its existing imports of `PaginatedResponse`/`PaginationQuery`/`ApiError` already go through the bare specifier, same as tailwind) | n/a (private app) | Verified via the same grep pattern as tailwind |

**Dependency type per package** (regular / peer / dev), matching the existing convention already used for `frontend-toolkit-core` itself in these same packages today: `toolkit-common` becomes a **peerDependency + devDependency** of `frontend-toolkit-core`, `backend-toolkit-core`, `backend-toolkit-mongoose`, `backend-toolkit-next`, and (later) `backend-toolkit-cloudinary` — peer because the consuming app (`nutrition-staff`) may also import `toolkit-common` types directly, requiring exactly one shared instance across the tree (the same reason `class-validator`/`class-transformer` are peer deps of `backend-toolkit-core` today, and the same reason `frontend-toolkit-core` itself is currently a peer dep of all three backend packages).

**Publish order** (respecting the graph — nothing publishes before what it depends on):
```
1. toolkit-common                                    (0.1.0)
2. frontend-toolkit-core  ┐  (both depend only on toolkit-common — can publish in either
   backend-toolkit-core   ┘   order or in parallel)                    (0.4.0 / 0.3.0)
3. backend-toolkit-mongoose ┐ (both depend on backend-toolkit-core from step 2 —
   backend-toolkit-next     ┘  can publish in either order or in parallel)  (0.2.0 / 0.2.1)
4. nutrition-staff: bump dependency ranges, install, build, run full test suite
   (frontend-toolkit-tailwind is untouched in this phase — no publish needed)
```
Every step ends with that package's own build + test suite green before the next step begins — no repository is left in a temporarily-broken state, and nothing is published without your explicit go-ahead per package.

### 0.4 `frontend-toolkit-tailwind`'s dependency shape (re-export, not direct)

Verified: every one of `frontend-toolkit-tailwind`'s 53 current imports of anything from the `frontend-toolkit-core` universe goes through the **bare** `@kira-joo/frontend-toolkit-core` specifier — `grep` for the `/common` subpath inside its `src/` returns **zero matches**. It has an unbroken, 100%-consistent existing convention of "get everything through `frontend-toolkit-core`'s root export," never reaching into a subpath directly, even though the subpath has existed the whole time.

**Decision: keep it that way.** The new upload components (`FeatureImageUpload`, etc.) import `Localized<T>`/`ImageAsset`/`VideoAsset`/`UploadMode`/`UploadPolicy` from `@kira-joo/frontend-toolkit-core` (which re-exports them from `toolkit-common` at its root, per §0.2), **not** from `@kira-joo/toolkit-common` directly. `frontend-toolkit-tailwind` gains no new dependency edge — the graph stays exactly `frontend-toolkit-tailwind → frontend-toolkit-core → toolkit-common`, a clean chain with no diamond/skip-level dependency, and no new import pattern is introduced into a package where every existing file follows the opposite rule already.

**Explicit rule, documented as requested:** `frontend-toolkit-tailwind` must never depend on any backend package, must never know about Mongoose, Next.js route handlers, the Cloudinary SDK, or any nutrition-specific type, and reaches shared `toolkit-common` vocabulary **only** via `frontend-toolkit-core`'s re-export — never a direct dependency.

### 0.5 Explicitly out of scope (unchanged from v5, confirmed still correct)
`AuthUser`/`ResolvedRole`/`hasPermission` are independently defined, shape-compatible, but **never actually cross-imported** on either side (confirmed by the same grep methodology used everywhere else in this section) — this refactor's stated problem ("the backend imports shared code from the frontend package") doesn't apply to them. Left alone; flagged again below as an open question in case you want it folded in anyway.

---

## 1. Generic shared asset types (in `toolkit-common`, re-exported at `frontend-toolkit-core`'s root)
```ts
enum AssetProviderType { CLOUDINARY = "cloudinary" }
interface ImageAsset { provider: AssetProviderType; publicId: string; secureUrl: string; format: string; width: number; height: number; bytes: number; version?: number; placeholderUrl?: string; }
interface VideoAsset { provider: AssetProviderType; publicId: string; secureUrl: string; format: string; width?: number; height?: number; bytes: number; durationSeconds?: number; posterUrl?: string; }
enum UploadMode { ON_SUBMIT = "on-submit", IMMEDIATE = "immediate" }
```
Only `UploadMode.ON_SUBMIT` is implemented and used.

---

## 2. Upload-on-submit architecture (unchanged from v4/v5)
Selecting a file only creates a local `File`-backed preview (`URL.createObjectURL`) — nothing uploads until the owning form submits. The entity's create/update request becomes `multipart/form-data` (a `payload` JSON field + one file field per asset field with a new file); the server (manually parsing via `parseMultipartFormData()`, bypassing `createRoute`'s JSON-body pipeline) validates each file, uploads it via the Cloudinary provider, merges the normalized asset into the payload, validates the full DTO, and saves — all inside one request. On save failure, newly-uploaded assets are await-destroyed; on a successful replace, the previous asset is await-destroyed after the save succeeds (logged, not rolled back, on cleanup failure). No attestation token, no pending tag, no orphan sweep — there's no client-relayed Cloudinary response to distrust, since the server is the only party that ever talks to Cloudinary.

**Flag, not a blocker:** video files travel through our own Next.js server on every upload now. Confirm this is acceptable for the deployment target (open decision below).

---

## 3. Serverless-safe cleanup (unchanged)
Cleanup calls are always **awaited**, never fire-and-forget. Database success and Cloudinary cleanup success are independent outcomes.

## 4. Ownership rule (unchanged)
One asset, one owning field, never reused across documents.

## 5. Upload configuration policy (unchanged, `UploadPolicy` shape now in `toolkit-common`)
Named presets (`recipeImagePolicy`, `campaignHeroPolicy`, etc.) stay app-level. Server (`Buffer`-based) and client (`File`-based) validation are two small separate implementations sharing only the `UploadPolicy` type.

## 6. Placeholder & poster strategy (unchanged)
`placeholderUrl`/`posterUrl` are cheap derived Cloudinary transformation URLs, no upload-time latency. `Video.poster?: ImageAsset` is an optional override for either uploaded or external videos.

---

## 7. Redesigned content modules

### SiteSettings (singleton)
`phone`, `whatsappNumber`, `email`, **`currencyCode: Currency`** (app-level enum, §0.1), `socialLinks: [{platform, url, order}]`, `logo?/favicon?: ImageAsset`, `defaultSeo: {title, description}: Localized<string>` + `ogImage?: ImageAsset`, `activeCampaignId?: ObjectId`.

### DoctorProfile (singleton) — unchanged from v5
```ts
name: Localized<string>; tagline: Localized<string>; avatar?: ImageAsset; avatarAlt: Localized<string>;
bioSections: Array<{ heading?: Localized<string>; body: Localized<string>; order: number }>;
programHeading: Localized<string>; programHighlights: Array<{ text: Localized<string>; order: number }>;
whyChooseHeading: Localized<string>; whyChooseReasons: Array<{ text: Localized<string>; order: number }>;
featuredInLabel: Localized<string>; gallery: Array<{ image: ImageAsset; altText: Localized<string>; order: number }>;
```

### PackagesPageSettings (singleton) — unchanged
`title/titleAccent/subtitle: Localized<string>`, `durationLabels: {month/quarter/half: Localized<string>}`, `subscribeButtonLabel: Localized<string>`.

### Package (collection, 3 rows) — unchanged
`key`, `name: Localized<string>`, `tag?: Localized<string>`, `popular: boolean`, `variant: PackageVariant` (app-level), `icon: IconKey` (app-level), `followUpLabel: Localized<string>`, `pricingTiers`, `details`, `order`, `status`, optional `seoOverride`. No soft delete.

### RecipeCategory / RecipeFoodGroup / Recipe — unchanged from v5
### Review/Testimonial / Video / FaqSection / FaqItem — unchanged from v5

### Campaign — Builder architecture (expanded, per your point 6/7)

**Backend structure.** Blocks stay **embedded** in the Campaign document — verified this is the right call, not just the path of least resistance: `backend-toolkit-mongoose`'s `update()` is a single whole-document `findOneAndUpdate(where, patch)` with no `arrayFilters`/positional-operator support anywhere, and there's no existing embedded-subdocument-array example in this codebase to model a "referenced sub-collection" against anyway (every existing array field is just `ObjectId` refs). Given that, a separate `CampaignBlock` collection with its own repository would need genuinely new repository-layer capability for no real benefit — embedding is both the simpler and the better-supported choice.

**Your own open question — resolved:** "should block updates save one block at a time or the whole document?" **Both, at different layers, deliberately:** the **API is block-shaped** (sub-resource routes, one block's DTO per request, per-block validation), but the **repository write underneath is always whole-document** — each block route handler fetches the current Campaign, mutates the target block in the in-memory `blocks` array (insert/replace/remove/reorder), and calls the existing `repository.update()` with the complete array as the patch. This gives every client-facing benefit you asked for (small payloads — the client only ever sends the one block being edited; clear route semantics; per-block-type DTOs and validation errors) **without needing any new repository-layer capability** — it works entirely within what `update()` already does today. No toolkit change required for this.

Routes:
```
GET    /api/campaigns/:campaignId                 // header/settings fields
PUT    /api/campaigns/:campaignId                  // header/settings fields only, not blocks
POST   /api/campaigns/:campaignId/blocks           // add a block (append), body = one block's DTO
PUT    /api/campaigns/:campaignId/blocks/:blockId  // replace one block's content, body = that block type's DTO
DELETE /api/campaigns/:campaignId/blocks/:blockId  // remove one block, destroy its owned assets after success
PUT    /api/campaigns/:campaignId/blocks/reorder   // body = ordered array of blockIds only, no content
```
Nested dynamic route params are structurally supported already — verified `backend-toolkit-next`'s params pipeline takes a plain `Record<string, unknown>` from Next.js (not hard-coded to a single `id`) and validates it through the same generic `validateDto`/`validateParams` used everywhere else; a `FindCampaignBlockParamsDto { @IsMongoId() campaignId; @IsMongoId() blockId }` needs no new toolkit code, just a two-field DTO class exactly like every existing one-field params DTO.

Each block type gets its **own** DTO (`HeroBlockDto`, `RichTextBlockDto`, etc.), not one large DTO with many optional properties — validated via `class-transformer`'s discriminated-union support (`@Type(() => BlockDto, { discriminator: { property: "type", subTypes: [...] } })`). **Flagged honestly: this is genuinely new for this codebase** — no discriminated-union or `@ValidateIf` pattern exists anywhere in `backend-toolkit-core` or `nutrition-staff` today (verified by direct grep); the only precedent is a single fixed-shape `@ValidateNested()+@Type()` pair in a test fixture. It's a standard, documented `class-transformer` feature (already a dependency), just not one this codebase has exercised yet — budget real implementation/testing time for it, don't treat it as a known-quantity reuse.

Stable `id` per block (ULID/UUID, generated once, never regenerated on reorder) — unchanged from v5, now additionally justified by being the natural key for the sub-resource routes above (`:blockId`).

**Frontend structure.** A block registry, app-level (nutrition-staff, not toolkit — block editors are Campaign-specific):
```ts
const campaignBlockRegistry = {
  hero: { Editor: HeroBlockEditor, Preview: HeroBlockPreview, createDefaultValue: createHeroDefaults },
  richText: { Editor: RichTextBlockEditor, Preview: RichTextBlockPreview, createDefaultValue: createRichTextDefaults },
  // ...one entry per supported block type
};
```
Each block type has its own editor + preview component (not one giant builder file). The builder supports add/edit/delete/drag-reorder/inline preview/full-campaign preview/per-block validation indicators/publish errors linked back to their block+field, with local file preview and upload-on-submit scoped to whichever block/form is actually being saved (per §2 — the "form" being submitted for a single block's `PUT`/`POST` is that block's own editor, so its asset field(s) upload exactly per the same rules as any other entity).

**Vertical-slice order** (adopted as proposed): Campaign shell → Hero block end-to-end (add/edit/delete, image upload, reorder, preview, publish validation) → then richText → featureGrid → media → cta → faqRef → countdown, in that order. `timeline`/`statistics` stay schema-ready only, no admin UI, until separately approved.

### 7.4 Campaign asset lifecycle
Composes directly from §2/§3 — no new concept needed, just scoped to a block instead of a whole entity:
- **Add a block with an asset:** upload happens as part of that block's own `POST .../blocks` request (multipart, same rules as any entity create). Save failure → destroy the newly-uploaded asset.
- **Replace a block's asset:** same request pattern as any entity replace, on `PUT .../blocks/:blockId`. Save success → await-destroy the block's previous asset. Save failure → destroy the new asset, retain the old.
- **Clear an optional block asset:** explicit `null` in that block's payload, same as any entity's optional asset field — old asset await-destroyed after save success.
- **Delete a block:** `DELETE .../blocks/:blockId` → after the containing document save succeeds, destroy every asset owned by that block.
- **Delete the whole Campaign (hard delete):** destroy every asset across every block, then remove the document — per-asset failure logging, same as any other entity's hard delete.
- **Soft delete / recover:** every block's assets untouched either way — fully recoverable.
- **Reorder:** zero asset operations — pure array-position change.
- Asset ownership is tracked conceptually as **Campaign ID + block ID + property path** (e.g. "this ImageAsset belongs to campaign X, block Y, field `image`") — no separate ownership table, just the natural nesting of the document itself.

---

## 8. Currency (moved, app-level — see §0.1)
```ts
enum Currency { EGP = "EGP" }
```
Lives in `nutrition-staff/src/common/enums/currency.enum.ts` (not `toolkit-common`), matching the `Status`/`EntityName` precedent for closed, app-specific, runtime-validated sets. `SiteSettings.currencyCode: Currency`.

## 9. Active Campaign validation (unchanged)
## 10. Recursive publish-completeness validation (unchanged, function now in `toolkit-common`)
## 11. Upload component UX (unchanged)
## 12. Public API response shape (unchanged)
## 13. Exclusions and future features (unchanged)

## 14. Testing strategy
Unchanged from v5, plus: **`toolkit-common`** gets its own unit tests for every pure function/type that lands there (`isLocalizedComplete`, `findIncompleteLocalizedPaths`); Campaign's discriminated-union block DTOs get explicit per-block-type validation tests (valid + wrong-discriminator + missing-required-field cases) since this is genuinely new validation machinery for this codebase, not a reuse of an established pattern.

---

## Final dependency graph
```
toolkit-common
├── frontend-toolkit-core
│   └── frontend-toolkit-tailwind        (re-export only, no direct toolkit-common dep)
└── backend-toolkit-core
    ├── backend-toolkit-mongoose
    ├── backend-toolkit-next
    └── backend-toolkit-cloudinary        (added in Phase 2)

nutrition-staff → all of the above (no source import changes needed for the pre-existing types — see §0.2/§0.3)
```

---

## Implementation order, with checkpoints

**Phase 1 — dependency graph cleanup only (nothing new built yet):**
1. Scaffold `toolkit-common` (tsup/Vitest/GitHub Packages), move `SortOrder`/`PaginationQuery`/`PaginatedResponse`/`Dictionary`/`Nullable`/`ApiError`/`ApiValidationError` in, publish `0.1.0`.
2. Update `frontend-toolkit-core` (remove `./common` subpath, internals import from `toolkit-common`, root re-exports unchanged) and `backend-toolkit-core` (peer-dep swap) in parallel; publish `0.4.0` / `0.3.0`.
3. Update `backend-toolkit-mongoose` (`0.2.0`) and `backend-toolkit-next` (`0.2.1`, peer-dep cleanup only) in parallel.
4. Update `nutrition-staff`'s dependency ranges, install, build, run the full test suite.

> **Checkpoint A:** toolkit-common migration complete — all five toolkit repos build and test green independently; `nutrition-staff` builds, tests, and runs against the new versions with zero source-level regressions. No publishing beyond what's needed to reach this checkpoint happens without your separate go-ahead per package.

**Phase 2 — new localization + asset infrastructure, built directly on the clean graph:**
5. `Localized<T>`/`isLocalizedComplete`/`findIncompleteLocalizedPaths`/`ImageAsset`/`VideoAsset`/`AssetProviderType`/`UploadMode`/`UploadPolicy` in `toolkit-common`; `LocalizedStringDto` in `backend-toolkit-core`; `localizedStringField()`/`imageAssetField()`/`videoAssetField()` + `@Searchable({subPaths})` in `backend-toolkit-mongoose`; `parseMultipartFormData()`/`validateUploadedFile()` in `backend-toolkit-next`; scaffold + build `backend-toolkit-cloudinary`; `IMAGE_ASSET`/`VIDEO_ASSET` field types + upload components + `warnOnUnsavedChanges` in `frontend-toolkit-tailwind`.

> **Checkpoint B:** localized + asset contracts published; every consumer upgraded; all toolkit repos still green.

6. First asset-bearing nutrition-staff module (e.g. Review) establishes the manual-multipart route-handler pattern end-to-end.

> **Checkpoint C:** image upload vertical slice works on one simple module — create/replace/delete verified manually against real Cloudinary.

7. Singletons — SiteSettings (incl. `Currency` enum, `activeCampaignId`), DoctorProfile, PackagesPageSettings.

> **Checkpoint D:** singleton modules complete.

8. Remaining simple collections — Video; Taxonomies + Recipe; Package; FAQ.
9. Campaign — shell, then Hero block vertical slice.

> **Checkpoint E:** Campaign Hero block vertical slice complete (add/edit/delete/upload/reorder/preview/publish-validation) — architecture verified before the remaining block types are added.

10. Remaining Campaign block types in the stated order; `timeline`/`statistics` schema-only.
11. **Deferred, not started without separate approval:** Resources, Newsletter, dynamic navigation, Leads.

At every checkpoint: tests passing, builds passing, dependency versions aligned across repos, no stale imports, working trees reviewed — no publishing or pushing beyond what's needed to reach that checkpoint without your explicit approval.

---

## Open decisions needing your approval

1. **Fold `AuthUser`/`ResolvedRole`/`hasPermission` into `toolkit-common` too**, even though they aren't currently cross-imported? (§0.5)
2. **Video-through-server body size** — confirm the deployment target can accept video files in a single multipart request.
3. **Active-campaign timing rule** — may a published campaign be set active before its own `startDate`?
4. Confirm the **exclusions** (Resources, Newsletter, dynamic nav).
5. **Cloudinary account** — confirm you have (or will provision) one.
