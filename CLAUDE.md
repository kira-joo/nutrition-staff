# nutrition-staff

The CMS/CRM admin app **and the single backend for the whole product**. The
workspace constitution at `../CLAUDE.md` applies; this file covers only what is
specific to this repository.

This repo has no README and no `docs/` directory — the plans below and the code
itself are the orientation material.

## Branch policy — the one rule that matters most

**Never merge into `main`.** Implementation work happens on the `staging` branch
(branched from `main`); commit and push there freely, and leave every merge into
`main` to the user, who handles it personally when they decide the work is ready.

This supersedes the older `feature/<name>`-per-feature convention for the current
workflow. Older `feature/*` branches may still exist locally and remotely — they
are history, not the active pattern.

Run `git branch --show-current` before doing anything, and never assume the
working tree is where you left it — other sessions share these trees. `main`
contains merge commits from before any of this existed. That is history, not
permission.

## Route architecture

Every API route is built with `createGetRoute` / `createPostRoute` /
`createPutRoute` / `createDeleteRoute`, imported from
`src/server/core/route-factories.ts` (a thin re-export of
`@kira-joo/backend-toolkit-next`). A route declares only its DTOs, its `auth`
requirement, its `revalidateTags`, and its handler — connection management,
authentication, authorization, parsing, DTO validation, status resolution, and
error serialization all happen in the factory.

- **`PUT` for updates, never `PATCH`.**
- **Auth is required by default**; public routes opt out explicitly with
  `auth: false` plus `export const dynamic = "force-dynamic"`. Everything under
  `src/app/api/public/**` is public.
- Global wiring is one call: `configureNextBackendToolkit()` in
  `src/server/core/toolkit.config.ts`.
- Read `backend-toolkit-next/src/routes/create-route.ts` and its test file once —
  it makes every route file in this repo trivially readable.

## Cache invalidation

A route declares `revalidateTags` (static array or resolver); the factory
resolves it after the handler succeeds and passes the deduplicated tags to
`config.cache.publishRevalidation`, which POSTs to nutrition-client.

- Every entity's tag table lives in
  `src/server/core/revalidation/revalidate-entity.ts` — read it to see what any
  route busts.
- `src/server/core/revalidation/cache-tag.ts` is a **hand-kept-in-sync duplicate**
  of nutrition-client's `CacheTag`. If the two drift, invalidation silently
  stops matching and nothing warns you.
- Invalidation is best-effort: a failure is logged and never turns a successful
  write into a failed response.

## Repositories are database-only

Repositories never make external calls — no cache invalidation, no HTTP. That is
the route-factory layer's job, and it fires only from a real HTTP mutation,
never from a migration, script, test, or bulk operation that happens to call the
same repository method.

Schemas use `@kira-joo/backend-toolkit-mongoose` decorators. **No Typegoose, no
`@nestjs/mongoose`.** Uniqueness only via `@Unique()`. `_id` is preserved, `__v`
hidden, the `id` virtual disabled. Default sort is `{ createdAt: -1 }` when the
schema has timestamps, else `{ _id: -1 }`.

## Backend owns business logic

Grouping, sorting, filtering-to-published, and joining collections belong here —
not repeated by every frontend consumer. `GET /api/public/faq`
(`src/server/faq/get-public-faq.ts`) is the canonical example: it replaced two
flat endpoints plus client-side joining.

Public responses use narrower shapes than the admin CRUD shapes — they omit
`order`, `status`, `createdAt`, `updatedAt`. Every bilingual field is a
`LocalizedString` (`{ar, en}`, both keys always present by schema default).

## This app is not localized; its content is

There is no `[locale]` segment, no i18n library, and no locale middleware. The
admin UI is single-locale. What *is* bilingual is the CMS content it authors —
so Arabic content rendering, RTL text inside editors and previews, and
long-Arabic overflow are all still real concerns.

## QA and helper scripts

`scripts/qa/` holds real verification tooling — read its `README.md` first. It
covers minting an authenticated session when seeded logins fail
(`create-test-session.js` + `grant-admin-role.ts`, with `find-users-by-pattern.ts`
and `delete-user-by-email.ts` to clean up afterwards), mobile-overflow
regression, Books mark-renderer parity, paragraph mark splitting, PDF smoke, and
publish-lifecycle verification.

Use these instead of hand-rolling verification, and clean up throwaway accounts.

## Books

The Books system has its own invariants and its own skill —
`.claude/skills/books-system/SKILL.md`. Read it before touching anything under
`src/server/books/**`, `src/server/book-settings/**`, `src/common/books/**`, or
`src/common/book-blocks/**`. `BOOK_PLAN.md` is the architectural plan;
`PLAN.md` is the approved backoffice/backend implementation plan.
