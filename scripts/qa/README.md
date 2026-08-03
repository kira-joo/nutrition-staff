# QA / dev scripts

Reusable helpers for manual and scripted verification against a running
instance of the app. Not part of the build or test suite — run these
directly with `node`/`tsx` when you need them.

## Getting an authenticated session

The seeded demo users (`scripts/seed-users.ts`) only log in if their stored
password hash matches whatever `hashPassword`/`comparePassword` currently
does. If that ever drifts (e.g. mid-migration to a new hashing algorithm),
every seeded login starts failing with 401 and blocks manual verification
entirely. When that happens:

1. `node scripts/qa/create-test-session.js > session.json` — signs up a
   throwaway user through the real signup flow (always produces a
   compatible hash) and prints its email + access token.
2. `node --env-file=.env --import tsx scripts/qa/grant-admin-role.ts <email>` —
   a fresh signup gets `roles: []` by design, which isn't enough to view
   permission-gated pages. This grants the admin role directly in the
   database so the session is actually useful.
3. Use the printed token as the `ACCESS_TOKEN` env var for
   `check-mobile-overflow.js`, or set it directly via
   `localStorage.setItem("nutrition_staff_access_token", "<token>")` in a
   real browser for manual testing.

When you're done, clean up with `find-users-by-pattern.ts` +
`delete-user-by-email.ts` so throwaway accounts don't accumulate.

## Scripts

- **`create-test-session.js`** — signs up a fresh throwaway user via the
  real `/signup` flow and prints `{ email, token }` as JSON. Useful when
  seeded demo logins are broken, or you just need a disposable account.
- **`grant-admin-role.ts`** — grants the `admin` role to an existing user by
  email, directly in the database.
- **`find-users-by-pattern.ts`** — lists user emails matching a regex, e.g.
  to find leftover `qa-test-*` accounts before deleting them.
- **`delete-user-by-email.ts`** — hard-deletes one user by exact email.
- **`check-mobile-overflow.js`** — the main regression check for the
  "whole page scrolls into blank space on mobile" bug class. Launches a
  real headless Chromium instance, visits the main list/dashboard pages
  (and, if given a client id, the per-client form pages) at phone/tablet/
  desktop widths, and asserts `document.documentElement.scrollWidth`/
  `scrollHeight` never exceed the viewport — while confirming a wide
  table's own scroll wrapper is still allowed to overflow locally. Exits
  non-zero and prints the offending page/viewport combinations if anything
  regresses.

  ```
  npm run build && npm run start -- -p 4123 &
  ACCESS_TOKEN=<token> node scripts/qa/check-mobile-overflow.js [clientId]
  ```
