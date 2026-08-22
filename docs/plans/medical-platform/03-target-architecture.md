# 03 — Target architecture

**Status: APPROVED 2026-08-22.** Phase 3 begins the move;
Phase 0 does not touch structure.

## Purpose

Define the internal structure that (a) separates the sellable medical platform
from one customer's website content and from the nutrition specialty, (b) makes
a later product-repo extraction a `git mv` rather than a rewrite, and (c) does
not disturb `nutrition-client`.

## Current state

Flat and undifferentiated. `src/server/` holds 22 sibling domain directories in
one namespace — `books/` next to `clients/` next to `recipes/` next to
`nutrition-calculations/` — with no marker of which belong to the product being
sold. `src/app/api/` mirrors it. `src/common/` mixes DTO interface mirrors,
enums, forms, book blocks, campaign blocks, and authorization in one tree.

There is no import boundary of any kind. Nothing prevents a platform module
importing a Books type, or a nutrition module importing a campaign enum.

## Target state

### Decision: evolve in place, four pillars, no new repository

| # | Decision | Rationale |
|---|---|---|
| D1 | Evolve `nutrition-staff` in place; create no new repository in this programme | There is no second customer yet. A split now doubles the surface during every feature phase for a benefit that only materialises at the first sale. |
| D2 | Fence **four** pillars, not the brief's two | The code contains four products: the medical platform, the nutrition specialty, one customer's website CMS, and a bespoke Arabic book publisher. Two of the four are not being sold. |
| D3 | Enforce the boundary mechanically, not by convention | An unenforced boundary in a repo shared by concurrent sessions decays within weeks. |
| D4 | Record extraction as a deferred decision with explicit trigger criteria | So the option stays open and cheap without being exercised prematurely. |

### The structure

```
nutrition-staff/src/
├── core/                        infrastructure. zero domain knowledge.
│   ├── route-factories.ts       (moves from server/core/)
│   ├── toolkit.config.ts
│   ├── auth/                    JWT, resolveUser, token version
│   ├── authorization/           registry, role model, permission sync
│   ├── db/                      connect
│   ├── transaction/             withTransaction adoption helpers  ← doc 05
│   ├── request-context/         actor + organization ambient context  ← NEW
│   ├── audit/                   generic audit-event writer  ← NEW
│   ├── assets/                  upload policies, provider, cleanup
│   ├── documents/               private/signed document delivery  ← NEW
│   ├── revalidation/            cache tags, publishRevalidation
│   ├── singleton/               (retired in Phase 3 — see doc 06)
│   ├── validation/              OptionalOrCleared, publish-readiness
│   ├── rate-limit/
│   └── publishing/
│
├── platform/                    THE SELLABLE PRODUCT
│   ├── organization/            Organization, settings
│   ├── branches/                Branch, Room, Resource
│   ├── identity/                User, StaffMember  (was server/users, server/staff)
│   ├── practitioners/           Practitioner  ← NEW
│   ├── patients/                Patient  (was server/clients)
│   ├── appointments/            Appointment, AppointmentType, availability
│   ├── encounters/              Encounter, Observation, Diagnosis, Prescription
│   ├── clinical-templates/      EncounterTemplate, section registry host
│   ├── crm/                     ContactAttempt, FollowUp, Task  (was server/interactions)
│   ├── billing/                 Service, Invoice, InvoiceLine, Payment, Discount
│   ├── files/                   Document (patient-scoped attachments)
│   ├── notifications/           Notification, preferences
│   ├── search/                  cross-entity search composition
│   └── reporting/               dashboards, KPIs  (was server/dashboard)
│
├── verticals/
│   └── nutrition/               THE NUTRITION SPECIALTY
│       ├── vertical.ts          the registration manifest  ← doc 12
│       ├── assessments/         (was server/assessments)
│       ├── anthropometry/       nutrition half of ClientMeasurement
│       ├── calculations/        (was server/nutrition-calculations, engine intact)
│       └── patient-education/   recipes  ← see "Where recipes go"
│
├── site-cms/                    ONE CUSTOMER'S PUBLIC WEBSITE. NOT SOLD.
│   ├── site-settings/
│   ├── doctor-profile/          the marketing page, not a practitioner
│   ├── packages/                pricing-page content, not billing
│   ├── packages-page-settings/
│   ├── reviews/
│   ├── videos/
│   ├── faq/                     faq-sections, faq-items, get-public-faq
│   ├── campaigns/
│   └── leads/                   consultation-requests  ← see "Where leads go"
│
└── books/                       A SEPARATE PRODUCT. PRESERVED.
    └── (unchanged: books/, book-settings/, blocks, editions, render, artifacts)
```

`src/common/**` splits the same way, with `common/core/` for genuinely shared
enums and DTO mirrors.

**`src/app/api/**` does not move at all.** See the next section — this is a
correction to an earlier draft that said it should "mirror the same grouping",
which under the App Router would have changed URLs.

### The transport layer: `src/app/api/**` never moves

An earlier draft of this document said `src/app/api/**` should "mirror the same
grouping" while also promising that every API URL stays unchanged. **Those two
statements are incompatible.** Under the Next App Router the directory path *is*
the URL, so moving

```
src/app/api/patients/route.ts   →   src/app/api/platform/patients/route.ts
```

changes `/api/patients` to `/api/platform/patients` and breaks every caller.

**Decision: the route tree is a stable transport layer and is not restructured.**
Not by moving directories, and not by route groups either.

The reason this is clean rather than a compromise is that the route files are
*already* pure transport. Verified — `src/app/api/clients/route.ts` is 20 lines,
`src/app/api/clients/[id]/route.ts` is 33, and every one of the 102 route files
has the same shape: import DTOs and a use case from `src/server/**`, declare
`auth` and `revalidateTags`, delegate. There is no domain logic in the route tree
to organise.

So the pillar refactor changes the **import specifiers inside** those 102 files
and nothing else:

```diff
- import { createClient } from "src/server/clients/create-client";
+ import { registerPatient } from "src/platform/patients/register-patient";
```

A route file's *contents* change; its *path* never does.

**Route groups were considered and rejected.** `src/app/api/(platform)/patients/route.ts`
is URL-transparent and would work. But it still means physically relocating 102
files — every one of them an opportunity to change a URL by mistake — to buy
directory grouping in a tree that contains no domain logic worth grouping. There
are no route groups anywhere in the app today (verified: `find src/app -type d
-name '(*)'` returns nothing), so this would also introduce a convention for no
benefit. If grouping is ever genuinely wanted, `(pillar)` groups remain available
and are a safe, separate, purely-cosmetic change.

**The invariant, and how it is proven.** *The pillar refactor must not change a
single existing route URL.*

`scripts/qa/check-route-inventory.ts` walks `src/app/api/**`, derives every
`(urlPath, httpMethod)` pair from the directory structure and the exported route
handlers, and writes a sorted manifest. It is run and committed **before** the
refactor, run again after, and the two are diffed. A non-empty diff fails the
phase, and the check guards every later phase too.

**But a static manifest cannot prove semantic compatibility**, and the Codex
review was right to push on this. It cannot see: handlers re-exported or aliased
from another module; conditional or runtime-generated exports; changed auth
requirements, DTOs, status codes, response shapes, caching or content types;
`HEAD` implicitly served by `GET`; `OPTIONS`; middleware and rewrites; or
deployment-manifest differences. It also has to normalize `[id]`, `[...slug]`,
`[[...slug]]` and `(group)` syntax correctly, and should **reject** parallel
`@slot` and intercepting segments outright rather than inventing a URL for them.

So the invariant is proven by three things, not one:

1. **The static manifest diff** — catches a moved or renamed segment.
2. **Next's own build manifest**, compared before and after — catches what static
   analysis of source misses, because it is what the framework actually routes.
3. **Contract tests against representative requests** for a sampled set of
   routes plus **all four hand-rolled non-factory handlers**
   (`books/[id]/print-preview`, the PDF artifact route, `recipes/export-pdf`,
   `public/books/[slug]/pdf`). Those four return binary or streamed responses and
   bypass the factory entirely, so an exported-name check sees only that they
   exist — not that they still stream the right content type. They get explicit
   tests.

### Complete module move table

| Current | Target | Pillar |
|---|---|---|
| `src/app/api/**` | **unchanged** — transport only | — |
| `server/core/**` | `core/**` | core |
| `server/users/**` | `platform/identity/users/**` | platform |
| `server/staff/**` | `platform/identity/staff/**` | platform |
| — | `platform/practitioners/**` | platform (NEW) |
| — | `platform/organization/**`, `platform/branches/**` | platform (NEW) |
| `server/clients/**` | `platform/patients/**` | platform |
| `server/measurements/**` | **splits** → `platform/encounters/observations/**` + `verticals/nutrition/anthropometry/**` | both |
| `server/interactions/**` | `platform/crm/contact-attempts/**` | platform |
| `server/dashboard/**` | `platform/reporting/**` | platform |
| — | `platform/appointments/**`, `platform/encounters/**`, `platform/billing/**`, `platform/files/**`, `platform/notifications/**`, `platform/search/**`, `platform/clinical-templates/**` | platform (NEW) |
| `server/assessments/**` | `verticals/nutrition/assessments/**` | vertical |
| `server/nutrition-calculations/**` | `verticals/nutrition/calculations/**` (engine byte-identical) | vertical |
| `server/recipes/**`, `server/recipe-categories/**`, `server/recipe-food-groups/**` | `verticals/nutrition/patient-education/**` | vertical |
| `server/consultation-requests/**` | `site-cms/leads/**` | site-cms |
| `server/site-settings/**` | `site-cms/site-settings/**` | site-cms |
| `server/doctor-profile/**` | `site-cms/doctor-profile/**` | site-cms |
| `server/packages/**`, `server/packages-page-settings/**` | `site-cms/packages/**` | site-cms |
| `server/reviews/**`, `server/videos/**` | `site-cms/reviews/**`, `site-cms/videos/**` | site-cms |
| `server/faq-items/**`, `server/faq-sections/**`, `server/faq/**` | `site-cms/faq/**` | site-cms |
| `server/campaigns/**` | `site-cms/campaigns/**` | site-cms |
| `server/books/**`, `server/book-settings/**` | `books/**` (unchanged internally) | books |

### Two placements that needed an argument

**Where `recipes` goes → `verticals/nutrition/patient-education/`.**
Recipes wear three hats: public-website content consumed by `nutrition-client`
(`/api/public/recipes`), an internal staff tool (`POST /api/recipes/export-pdf`
hands a patient a recipe sheet), and a Books dependency (`RECIPE_REF` blocks,
with `BookEdition.recipeSnapshots` freezing them at publish). Pure `site-cms`
would be wrong — the staff-facing PDF export is genuinely a clinical patient-
education action, and it is nutrition-specific. Pure `platform` would be wrong —
a dental clinic has no recipes. So: nutrition vertical, with the public read
endpoints kept exactly where they are, and Books permitted to import from it
(`books → verticals/nutrition/patient-education` is an allowed edge, recorded as
the one exception in the boundary rules below).

**Where `consultation-requests` goes → `site-cms/leads/`.**
It is public website lead capture. But it *creates a Patient*, so it crosses into
the platform pillar. The dependency direction resolves it: `site-cms` may import
`platform`, never the reverse. Lead capture calls a platform-owned
`registerPatient` use case; the platform knows nothing about leads. This also
preserves the deliberate firewall documented on `CreateConsultationRequestDto` —
the public DTO is *not* the patient DTO, and the public response is always
`{success:true}`.

### Import boundary rules

| From ↓ / May import → | core | platform | verticals | site-cms | books |
|---|---|---|---|---|---|
| **core** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **platform** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **verticals** | ✅ | ✅ | own vertical only | ❌ | ❌ |
| **site-cms** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **books** | ✅ | ❌ | ⚠️ `nutrition/patient-education` only | ✅ | ✅ |

The one rule that matters: **`platform/` never imports `verticals/`,
`site-cms/`, or `books/`.** Everything else is a consequence. `core/` importing
nothing but toolkit packages is what keeps it reusable.

`src/app/api/**` route files are thin and may import from the pillar they serve
plus `core`. `src/common/**` follows the same table.

### Enforcement mechanism

Convention is insufficient — multiple sessions share these trees. Three layers,
in ascending cost:

1. **`eslint-plugin-boundaries`** (or `import/no-restricted-paths`) configured in
   a new `.eslintrc` — the repo has a `lint` script and **no ESLint config file
   at all** today, which is a separate gap this closes. Element types are the
   five pillars, resolved by path; the table above becomes the rule set. This is
   the primary gate and runs in the same command developers already use.
2. **`scripts/qa/check-import-boundaries.ts`** — a standalone script that walks
   the import graph and exits non-zero on a violation, so the boundary is
   checkable without a working lint config and can gate a checkpoint.
3. **A `dependency-cruiser` config** producing a rendered graph, for review
   rather than for gating. Optional; useful at the extraction decision point.

Deliberately *not* used: TypeScript project references (would require splitting
`tsconfig.json` per pillar inside one Next app, which Next's build does not like),
and separate npm workspaces (this is not a monorepo, by workspace constitution).

### Why this makes extraction cheap later

If the extraction trigger fires, the operation becomes: copy `core/` +
`platform/` + `verticals/` and their `app/api` mirrors into a new repo; delete
`site-cms/` and `books/` there; delete `platform/` and `verticals/` here;
re-point `nutrition-client`'s 18 endpoint paths at whichever deployment keeps the
website. Because `platform` imports nothing from the other pillars, that copy
compiles. Without the boundary rule it would not, and the estimate would be
weeks rather than days.

**Extraction trigger criteria** — revisit the decision when any two are true:

- A second paying customer exists who does not want the Dr. Omnia website CMS.
- Row-level SaaS tenancy is adopted (see [06](06-organization-and-branches.md)).
- The `site-cms` + `books` pillars stop receiving changes for two consecutive
  quarters while `platform` keeps changing.
- Build or deploy time for the platform work is materially harmed by carrying
  Puppeteer, Chromium, TipTap and `pdf-lib`.

## Scope

In: the `src/server/**` → pillar directory move, rewriting the import
specifiers in the 102 route files, the `src/common/**` split, the ESLint boundary
config, the boundary check script, the route-inventory check, and updating
`nutrition-staff/CLAUDE.md` to describe the pillars.

Explicitly **not** in scope: any change to the `src/app/api/**` directory
structure.

Out: any behaviour change. The move is mechanical and must be provable as such.

## Backward compatibility

- Every `/api/**` **URL** is unchanged by the move, because no route file moves
  at all — only the import specifiers inside them change. Proven by the
  route-inventory diff, not asserted. The 18 public paths are frozen.
- Mongoose model names and collection names are untouched by this document. The
  only rename is `Client → Patient` and it belongs to [20](20-migration-strategy.md).
- `scripts/**` and `scripts/qa/**` import paths update mechanically.
- The Books invariants are untouched — the pillar's internals do not move.

## Edge cases and risks

| Risk | Mitigation |
|---|---|
| A move of ~500 files creates a merge nightmare for the three repos with unpushed `staging` commits and for concurrent sessions | Do the move as **one commit, in one sitting**, after pushing outstanding work. Nothing else lands that day. |
| `src/server/core/authorization/role.model` is a load-bearing **side-effect import** — Next dev-mode compiles `instrumentation.ts` as a separate bundle, so model registration must happen in the route module graph | The comment in `toolkit.config.ts` explains it. Preserve the side-effect import when `core/` moves, and verify `@Relation(() => RoleSchema)` still resolves at request time before closing the phase. |
| Path aliases: the repo imports as `src/server/...` | Update `tsconfig.json` paths and rely on `tsc --noEmit` to find every stale specifier. A move with zero behaviour change should produce zero type errors. |
| Books imports from `site-cms` and from nutrition patient-education | Recorded as allowed edges rather than pretended away. |

## Testing strategy

The move is verified by absence of change, not by new tests:

1. `npx tsc --noEmit` clean.
2. The full existing test suite green (1 file — which is itself the argument for
   Phase 0A landing first).
3. **The route-inventory proof, in three parts:** the committed static manifest
   diff, Next's build manifest diff, and contract tests over sampled routes plus
   all four hand-rolled binary handlers. A static manifest alone proves the URL
   set is unchanged, not that the routes still behave the same.
4. `nutrition-client` builds and all 18 public endpoints return byte-identical
   shapes for a fixed fixture set.
5. `scripts/qa/check-mobile-overflow.js` passes, proving the app still boots and
   renders.

## Acceptance criteria

- [ ] `platform/` contains zero imports from `verticals/`, `site-cms/` or `books/`,
      proven by the boundary check exiting 0.
- [ ] ESLint config exists and the boundary rules fail a deliberate violation.
- [ ] Route inventory before/after is **byte-identical**, proven by a committed
      manifest and a checked-in diff.
- [ ] Zero files moved under `src/app/api/`.
- [ ] `nutrition-client` untouched and still green.
- [ ] `nutrition-staff/CLAUDE.md` describes the pillars and the boundary rule.

## Prerequisites

Phase 0 complete (the move is far safer with a test project and a migration
framework in place). Outstanding `staging` commits pushed in all repos.

## Downstream dependencies

Phases 3 onward all assume this structure. [23](23-site-cms-and-books-disposition.md)
depends on the `site-cms` and `books` fences existing.

## Codex findings and resolution

Not yet consulted. Questions for Codex: (a) is a single 500-file move commit
genuinely safer than an incremental pillar-at-a-time move, given concurrent
sessions? (b) does `eslint-plugin-boundaries` work reliably against Next's
`src/app` conventions and the `src/`-prefixed import style used here? (c) is
placing `recipes` in the nutrition vertical defensible given Books depends on it,
or does that argue for a fifth `shared-content` pillar? (d) is leaving `src/app/api/**` entirely untouched right?

**Reviewed 2026-08-22. Verdict on the API route strategy: SOUND.** The reviewer
agreed the route tree should not move, and confirmed route groups are
URL-transparent (so the first draft's reason for rejecting them was wrong even
though the conclusion — unnecessary churn — stands). Two findings accepted:

| # | Finding | Sev | Resolution |
|---|---|---|---|
| 1 | A static source manifest cannot prove semantic compatibility — it misses aliased/conditional exports, changed auth/DTOs/status codes/content types, `HEAD`/`OPTIONS`, middleware and rewrites. | MAJOR | **Accepted.** The proof is now three-part: static manifest, Next build manifest, and contract tests. |
| 2 | "Every route is pure transport" is contradicted by the four hand-rolled handlers; reading exported names sees their existence, not their behaviour. | MAJOR | **Accepted.** All four get explicit contract tests for content type and streaming. |

Also accepted: the URL-derivation script must normalize dynamic/catch-all/group
syntax and explicitly reject parallel and intercepting segments rather than
guessing.
