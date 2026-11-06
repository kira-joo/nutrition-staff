# 23 — Site CMS and Books disposition

**Status: APPROVED 2026-08-22.** Can run at any time; touches
nothing the platform pillar owns.

## Purpose

Decide what happens to the two pillars that are **not** part of the sellable
product, without breaking the customer who depends on them.

## The finding

More than half of this repository is not the product being planned.

| Subsystem                                      | Size                                                                        | What it is                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Books**                                      | ~90 backend files + ~4.2k frontend LOC (≈ a quarter of the entire frontend) | A bespoke Arabic digital publishing system: chapters, 12 block types, TipTap rich text, references and citations, immutable editions with frozen content and recipe snapshots, Puppeteer PDF rendering against a `dr-omnia-book-v1` template, artifact generation, a public flipbook reader |
| **Campaigns**                                  | ~30 files                                                                   | A marketing landing-page builder: 7 block types, slug-routed, date-windowed                                                                                                                                                                                                                 |
| **Packages + PackagesPageSettings**            | —                                                                           | Public pricing-page content                                                                                                                                                                                                                                                                 |
| **Reviews**                                    | —                                                                           | Marketing testimonials with before/after weight-loss images                                                                                                                                                                                                                                 |
| **Videos**                                     | —                                                                           | A public content library                                                                                                                                                                                                                                                                    |
| **FAQ (sections + items + composed endpoint)** | —                                                                           | Public website FAQ                                                                                                                                                                                                                                                                          |
| **SiteSettings**                               | —                                                                           | Website config: SEO, ogImage, social links, active campaign                                                                                                                                                                                                                                 |
| **DoctorProfile**                              | —                                                                           | The public "about the doctor" page                                                                                                                                                                                                                                                          |

A clinic in Alexandria buying a medical platform does not want an Arabic book
publisher, a landing-page builder, or Dr. Omnia's testimonials.

## The decision

**Keep everything in the repository, fenced as deployment-specific. Delete
nothing. Extract nothing now.**

| #   | Decision                                                                          | Rationale                                                                                     |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| D1  | `site-cms/` and `books/` become explicit pillars with an enforced import boundary | Makes them visibly not-the-product, and makes a later extraction a move rather than a rewrite |
| D2  | Nothing is deleted or rewritten                                                   | It all works, `nutrition-client` depends on it, and Books is a genuinely successful product   |
| D3  | Books is **not** redesigned                                                       | Preserved successful experience. Explicit in the workspace constitution                       |
| D4  | Both are org-scoped like everything else                                          | So the tenancy model has no holes                                                             |
| D5  | Extraction is a deferred decision with published trigger criteria                 | Keeps the option open and cheap without exercising it                                         |

## Books, specifically

Books gets its **own pillar**, not a slot inside `site-cms/`. The brief's
vertical model (§5) never mentions it, and it does not fit either category:

- It is not clinic management, so it is not `platform/`.
- It is not nutrition clinical work, so it is not a vertical.
- It is not website _content management_ either — it is a publishing product with
  its own draft/edition lifecycle, its own renderer, and its own public reader.

It also has invariants that must not be disturbed by any restructuring, each of
which exists because it broke once:

- **`Book` is a mutable draft; `BookEdition` is an immutable frozen snapshot**
  (`content`, `resolvedSettings`, `recipeSnapshots`, `templateVersion`), with
  `currentEditionId` as the pointer. Publishing freezes a new edition and never
  rewrites published content. There is deliberately no PUT or DELETE on an
  edition.
- Watermarks must never affect pagination.
- Rich text uses controlled tokens, never raw CSS.
- The flip engine stays behind an adapter.
- `assert-book-size-budget` and the `book-limits.ts` caps hold.
- The staff↔client mark renderer is a **deliberate duplicate** guarded by
  `scripts/qa/check-mark-renderer-parity.ts` — a drift guard that must keep
  working.

The pillar move touches none of these: Books' internals do not move, only its
parent directory. Verification is that the four Books QA scripts still pass.

**Two allowed cross-pillar edges**, recorded rather than pretended away:

1. `books → site-cms` — the public flipbook and book settings share website
   concerns.
2. `books → verticals/nutrition/patient-education` — `RECIPE_REF` blocks and
   `BookEdition.recipeSnapshots` reference recipes, which live in the nutrition
   vertical for the reasons argued in [03](03-target-architecture.md).

Edge 2 is the one wart in an otherwise clean boundary graph. The alternative —
a fifth `shared-content` pillar existing solely to hold recipes — was considered
and rejected as more structure than the problem deserves. Flagged for Codex.

## One thing that does move out

**`DoctorProfile` stays in `site-cms/`, and that is the decision** — but it is
worth stating why, because the audit flagged it as a landmine.

`DoctorProfile` is a singleton with no `userId`, whose fields are `tagline`,
`bioSections`, `programHighlights`, `whyChooseReasons`, `stats` and `gallery`,
all `LocalizedString`. It is a marketing page. It is **not** a practitioner
record, and a medical platform needs `Practitioner` — many of them, linked to
`User`, with credentials, specialty and a schedule.

The tempting move is to rename `DoctorProfile → Practitioner`. **Rejected.**
`EntityName.DOCTOR_PROFILE` already appears in 5 generated permission keys,
`entity-labels.ts`, and the `DOCTOR_PROFILE` cache tag **shared by hand with
`nutrition-client`**. Renaming it would cost a permission migration and a
cross-repo cache-tag change for zero benefit, because the marketing page still
needs to exist. So: `Practitioner` is a **new** entity
([04](04-domain-model.md) §2), and `DoctorProfile` keeps its name, its keys and
its tag, in `site-cms/`, where it belongs.

Books' one-doctor assumption (`bookOverridesSchema` and `BookSettings` carry
`doctorName`/`doctorTitle`/`doctorBio`/`doctorImage` as plain strings) is
**left alone**. Books is a single-author product for this customer. Generalising
it would be work in service of a hypothetical.

## Recipes — the one genuinely ambiguous case

Recipes wear three hats: public website content (`/api/public/recipes`, consumed
by `nutrition-client`), a staff clinical tool (`POST /api/recipes/export-pdf`
hands a patient a recipe sheet), and a Books dependency (`RECIPE_REF` blocks).

Placed in `verticals/nutrition/patient-education/` because the staff-facing PDF
export is genuinely clinical patient education, and it is nutrition-specific — a
dental clinic has no recipes. Public endpoints do not move. Full argument in
[03](03-target-architecture.md).

## What changes for these pillars

Almost nothing, deliberately:

- Directory location and import boundary.
- `organizationId` added, like everywhere else (M5).
- The four settings records become org-scoped rows instead of `where: {}`
  singletons (M6) — **with byte-identical public response shapes**, which is what
  protects `nutrition-client`.
- The `video(id)` cache-tag drift is fixed: `nutrition-client` has the helper,
  `nutrition-staff` does not, so a video detail page can never currently be
  invalidated. Small, self-contained, and worth doing before restructuring makes
  it harder to notice.
- Stale comments corrected: `SiteSettings.activeCampaignId` is an untyped
  `ObjectId` with **no `ref`** whose comment says no Campaign collection exists
  yet (it does); the `BookArtifact` schema comment says no generation route
  exists yet (it does); `assert-book-size-budget.ts` says it is not yet exercised
  by any route (it is).

## What must not break

- **All 18 `/api/public/**` routes**, byte-identical. This is the contract that
  keeps `nutrition-client` untouched, and it is verified every phase, not once.
- The `CacheTag` vocabulary and the revalidation HTTP contract.
- The `ConsultationRequestIntent` enum, duplicated in
  `nutrition-client/src/lib/domain/consultation-request.ts`.
- Every Books invariant listed above, and all four Books QA scripts.
- `nutrition-client`'s recipe filtering, taxonomy and pagination contracts.

## Extraction trigger criteria

Revisit the split when **any two** are true:

1. A second paying customer exists who does not want the Dr. Omnia website CMS.
2. Row-level SaaS tenancy is adopted.
3. `site-cms/` and `books/` receive no changes for two consecutive quarters while
   `platform/` keeps changing.
4. Build or deploy time for platform work is materially harmed by carrying
   Puppeteer, Chromium, TipTap and `pdf-lib`.

If it fires, the operation is: copy `core/` + `platform/` + `verticals/` and
their `app/api` mirrors into a new repo; delete `site-cms/` and `books/` there;
delete `platform/` and `verticals/` here; re-point the 18 public endpoint paths.
Because `platform/` imports nothing from the other pillars, that copy compiles.
**Without the boundary rule it would not**, and that is the entire value of doing
this now.

## Testing strategy

Route-inventory diff identical before and after the move · all 18 public
endpoints byte-identical against a fixture set · the four Books QA scripts pass ·
`nutrition-client` builds and renders · the cache-tag parity check passes once the
`video(id)` drift is fixed · the boundary check exits 0.

## Acceptance criteria

- [ ] `site-cms/` and `books/` are explicit pillars with the boundary enforced.
- [ ] Nothing deleted, nothing redesigned, no Books invariant touched.
- [ ] All 18 public endpoints byte-identical.
- [ ] The `video(id)` cache-tag drift fixed and guarded by a parity check.
- [ ] The four stale comments corrected.
- [ ] Extraction trigger criteria published in this document and referenced from
      the README.

## Codex findings and resolution

Not yet consulted. Ask: (a) is `books → verticals/nutrition/patient-education`
acceptable, or does it justify a fifth pillar? (b) is keeping the Dr. Omnia CMS
in the product repository sustainable through ten phases, or does the extraction
trigger need to be more aggressive? (c) is leaving Books' one-doctor assumption
in place safe if a second author ever appears?
