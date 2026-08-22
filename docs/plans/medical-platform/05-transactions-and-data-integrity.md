# 05 — Transactions and data integrity

**Status: APPROVED 2026-08-22.** Phase 0 track 0C. Gates every
multi-collection write introduced from Phase 3 onward.

## Purpose

Make transactional integrity a **shared infrastructure concern with one
abstraction**, so that no service ever writes
`startSession` / `try` / `commitTransaction` / `catch` / `abortTransaction` /
`finally` / `endSession` again, and so that repositories and composed domain
operations participate in the same transaction without any local plumbing.

This matters more here than in a typical CRUD app. A clinical record and an
invoice are not a blog post: a half-written encounter, a payment recorded
against an invoice that was never created, or a patient whose identity row
committed while their medical record did not, are all defects that surface as
clinical or financial errors rather than as a 500.

## Current state

### What already exists — and it is more than expected

`session?: mongoose.ClientSession` is threaded through **every single read and
write path** of `MongooseRepository`. Verified, file by file:

| Path | File | Evidence |
|---|---|---|
| `findOne`, `findAll` | `backend-toolkit-mongoose/src/repository/create-mongoose-repository.ts:110,131,142,165` | destructures `session`, forwards to `executeFindQuery` |
| query application | `.../repository/execute-find-query.ts:27,94` | `query.session(options.session)` |
| `count` | `create-mongoose-repository.ts:176` | `executeCountQuery(model, filter, criteria.session)` |
| `findAllAndCountPublic` | `create-mongoose-repository.ts:187,217,219` | forwards to both the find and the count |
| `findAllNoCountPublic` | `create-mongoose-repository.ts:226,254` | — |
| `save` (single + many) | `.../write/execute-save.ts:37,57,104` | `document.save({ session })`, `insertMany({ session })` |
| `update` | `.../write/execute-update.ts:11,41` | — |
| `delete` / `remove` | `.../write/execute-delete.ts:10,27,49` | — |
| `softDelete` / `softRemove` | `.../soft-delete/execute-soft-delete.ts:13,51,62,94`, `execute-soft-remove.ts:11,37,67` | — |
| criteria typing | `.../repository/mongoose-repository.interface.ts:9-14` | narrows core's `session?: unknown` to `mongoose.ClientSession` |
| core contract | `backend-toolkit-core/src/repository/find-criteria.interface.ts` | `session?: unknown`, documented as ODM-narrowed |

**The plumbing is complete. Nothing is missing at the repository layer.**

### What is missing

`startSession`, `withTransaction`, `commitTransaction` and `abortTransaction`
appear in **zero source files** across all seven packages and all of
`nutrition-staff`. The only occurrences anywhere are inside the toolkit's own
tests:

- `backend-toolkit-mongoose/src/repository/create-mongoose-repository.test.ts:600-670`
  — three integration tests over a `MongoMemoryReplSet`, already covering
  create-then-read-in-transaction, commit, and abort.
- `backend-toolkit-mongoose/src/repository/write/execute-save.test.ts:139-165`
  — same harness for `save`.

So: sessions can be *joined*, but nothing in the workspace can *start* one, and
no application code has ever tried.

### The consequence, in the app today

`nutrition-staff/src/server/clients/create-client.ts:19-22` states it plainly:

> *"Not a real database transaction (this app has none … no precedent for
> Mongoose sessions anywhere in this codebase)."*

Its rollback is a manual `userRepository.delete()` inside a `catch`. Six paths
perform multi-collection writes with no atomicity:

| Path | Collections written | Current failure mode |
|---|---|---|
| `src/server/clients/create-client.ts` | `users`, `clients` | manual `catch` + `delete`; if the compensating delete itself fails, an orphan `User` persists |
| `src/server/clients/update-client.ts:24-33` | `users`, `clients` | splits one DTO across two collections, writes each half separately — a partial update is invisible to the caller, which still gets a 200 |
| `src/server/users/delete-user.ts` | `clients`, `staffs`, `users` | soft-deletes both satellites then **hard**-deletes the `User`; a crash between steps leaves soft-deleted profiles pointing at a live user, or an orphaned clinical graph |
| `src/server/consultation-requests/create-consultation-request.ts` | `consultationrequests`, `users`, `clients` | three identity-resolution branches, no atomicity; always answers `{success:true}` so a partial write is silent by design |
| `src/server/interactions/create-client-interaction.ts` | `clientinteractions`, `clients` | write-through of `lastContactedAt`/`nextFollowUpAt`; a failed second write leaves the CRM cache permanently stale |
| `src/server/books/publishing/publish-book-edition.ts` | `books`, `bookeditions` | optimistic `contentRevision` locking mitigates but does not remove the window |

None of these is currently tested. `create-client.ts`'s conflict and rollback
branches in particular are the highest-risk untested code in the repository
after the nutrition engine.

### Two hard operational facts

1. **MongoDB transactions require a replica set or a sharded cluster.** A
   standalone `mongod` rejects `startTransaction` with
   `IllegalOperation: Transaction numbers are only allowed on a replica set
   member or mongos`. Local development against a plain `mongod` will therefore
   *fail loudly* the moment a transaction is attempted. This is a setup
   requirement, not an edge case — see *Deployment and local development* below.
2. **The app uses the global mongoose singleton.**
   `src/server/core/db/connect.ts` calls `mongoose.connect(...)` and caches the
   result on `global.mongooseConnection`; `createMongoModel` defaults to
   `mongoose` (`backend-toolkit-mongoose/src/schema/create-mongo-model.ts`). So
   the session must be started from `mongoose.connection` (or, more precisely,
   from the connection the models were registered on), not from an
   application-owned connection object that does not exist.

## Target state

### The abstraction

**Built on the driver's own transaction helper, not a hand-rolled retry loop.**
Mongoose's `Connection#transaction()` / the Node driver's `withTransaction()`
already implement the commit-label retry semantics correctly — including the
`UnknownTransactionCommitResult` retry that is easy to get subtly wrong. This
package wraps that rather than reimplementing it, and adds the three things the
driver does not provide: ambient session propagation, rollback-only marking, and
commit/abort hooks.

Two exports, one concept:

```ts
// @kira-joo/backend-toolkit-mongoose

/**
 * Runs `fn` inside a single MongoDB transaction. Commits on resolve, aborts on
 * throw, always ends the session. The session is published to an ambient
 * context, so every repository call made inside `fn` — at any depth, through
 * any number of intermediate functions — joins the transaction automatically.
 */
export function withTransaction<T>(
  fn: (tx: TransactionContext) => Promise<T>,
  options?: WithTransactionOptions
): Promise<T>;

/** The active transaction, or `null` when not inside one. */
export function getActiveTransaction(): TransactionContext | null;

export interface TransactionContext {
  /** The underlying Mongoose session. Escape hatch for raw model access. */
  readonly session: mongoose.ClientSession;
  /** Depth of nesting. 1 for the outermost `withTransaction`. */
  readonly depth: number;

  /**
   * Marks this transaction as rollback-only. The outermost frame will abort
   * even if its callback resolves normally, and will throw
   * `TransactionAbortedError` with `cause` set to the first retained cause.
   *
   * Call this whenever you catch an error inside a transaction and do not
   * rethrow it. Idempotent; only the FIRST cause is retained.
   */
  markRollbackOnly(cause?: unknown): void;

  /** True once `markRollbackOnly` has been called at any depth. */
  readonly isRollbackOnly: boolean;

  /** The first retained cause, if any. */
  readonly rollbackCause: unknown;

  /**
   * Registers a callback to run only after the FINAL successful commit.
   * Cleared before every retry attempt, so a retried `fn` cannot register
   * duplicates.
   */
  onCommit(callback: () => void | Promise<void>): void;

  /**
   * Registers a callback to run only after the FINAL abort — not after an
   * intermediate attempt that will be retried. Use this for compensating
   * actions such as deleting an uploaded asset.
   */
  onAbort(callback: (error: unknown) => void | Promise<void>): void;

  /**
   * Runs after EVERY failed attempt, including ones that will be retried.
   * For attempt-local cleanup only.
   */
  onAttemptFailed(callback: (error: unknown) => void | Promise<void>): void;

  /** Which retry attempt this is. 1 on the first. */
  readonly attempt: number;
}

export interface WithTransactionOptions {
  /** Connection to start the session on. Defaults to the global mongoose connection. */
  connection?: mongoose.Connection;
  /** Passed straight to `session.startTransaction()`. */
  transactionOptions?: mongoose.mongo.TransactionOptions;
  /**
   * Retry attempts for `TransientTransactionError` / `UnknownTransactionCommitResult`.
   * Defaults to 3. Set 0 to disable.
   */
  maxRetries?: number;
}
```

Call sites read like this — no session variable, no `try`, no `finally`:

```ts
export async function registerPatient(dto: RegisterPatientDto, actor: Actor) {
  return withTransaction(async () => {
    const user    = await userRepository.save({ name: dto.name, phone: dto.phone });
    const patient = await patientRepository.save({
      userId: user._id,
      mrn: await allocateMrn(actor.organizationId),
    });
    await recordAuditEvent({ action: "Patient.create", subjectId: patient._id });
    return patient;
  });
}
```

`userRepository.save`, `patientRepository.save`, `allocateMrn` and
`recordAuditEvent` all join the transaction without being told about it, and
without any of them taking a `session` parameter.

### How repositories receive the session

**Ambient context via `AsyncLocalStorage`, with an explicit override.**

`withTransaction` runs `fn` inside `als.run(context, fn)` using
`AsyncLocalStorage` from `node:async_hooks`. Every repository method resolves
its session as:

```
effectiveSession = criteria.session ?? getActiveTransaction()?.session ?? undefined
```

That single line goes into one place — a new
`backend-toolkit-mongoose/src/repository/transaction/resolve-session.ts` — and is
called by the seven executors that already accept a session. The public
`MongooseFindCriteria.session` field keeps working exactly as it does today.

Two safety rules on that resolution, both from the review:

- **A *different* explicit session inside an ambient transaction is rejected.**
  `criteria.session ?? ambient` would otherwise let a caller silently split one
  logical operation across two transactions. If an ambient context exists, an
  explicit `criteria.session` must be the *same* session by identity, or the
  repository throws. Passing the ambient session explicitly stays legal.
- **The Node runtime is declared, not assumed.** `AsyncLocalStorage` does not
  exist on Next's Edge runtime. Every route here is Node today (mongoose,
  puppeteer), but that is an accident of dependencies rather than an enforced
  invariant — route files declare only `dynamic`
  (`src/app/api/clients/route.ts:8`). Phase 0C adds
  `export const runtime = "nodejs"` to the API segment convention plus a static
  check that fails on an `edge` declaration under `src/app/api/**`.

Why this mechanism and not the alternatives:

| Option | Verdict |
|---|---|
| **AsyncLocalStorage ambient context** ✅ | Zero boilerplate; works through arbitrary call depth; explicit `criteria.session` still wins; no repository signature changes; no DI container needed. Requires the Node runtime (satisfied — every package declares `engines.node >= 18`, and these route handlers already require Node for `mongoose` and `puppeteer`). |
| Thread `session` explicitly everywhere | This is what the codebase does today via `criteria.session`, and it is precisely the boilerplate to be removed. It also cannot work for helpers like `allocateMrn` or `recordAuditEvent` without polluting every signature. |
| Transaction-scoped repository instances (`repo.withSession(s)`) | Repositories are **module-level consts** (`export const clientProfileRepository = createMongooseRepository({...})`) with no DI container. Introducing per-request instances is a much larger architectural change, and every call site would have to be rewritten to obtain its repository from a context. |
| Inject the session through the route-factory context | `RouteHandlerContext` is `{body, query, params, user, request}` and nothing else. Adding a session there only relocates the threading problem — it does not remove it, and it forces every service to accept a context argument. |

**The Edge-runtime caveat, stated plainly:** `AsyncLocalStorage` is a Node API.
It is unavailable in Next's Edge runtime. Every route in this app is Node
runtime already (mongoose, puppeteer, `@sparticuz/chromium`), so this is not a
present constraint — but `withTransaction` must throw a `ConfigurationError`
with an actionable message rather than silently losing the context if
`AsyncLocalStorage` is absent.

### How nested and composed operations behave

**Nesting joins the outer transaction. It never opens a second one.**

```
withTransaction(async () => {          // depth 1 — starts session, starts txn
  await createPatient();               //           joins
  await withTransaction(async () => {  // depth 2 — JOINS, does not start
    await createEncounter();           //           joins the same session
  });                                  //           commits nothing
});                                    // depth 1 — commits (or aborts) once
```

Rules:

1. **Reentrancy.** If `getActiveTransaction()` returns non-null,
   `withTransaction` does **not** start a new session. It increments `depth`,
   invokes `fn` with the same context, and returns. Only the outermost call
   commits or aborts.
2. **An inner throw aborts the whole transaction.** There is no partial commit
   and no savepoint — MongoDB has no savepoints, so a nested "sub-transaction"
   is a fiction we refuse to fake. An inner `withTransaction` that throws
   propagates, and the outermost frame aborts everything.
3. **A nested frame that throws marks the shared context rollback-only.** The
   inner `withTransaction` catches, calls `markRollbackOnly(error)` on the
   shared context, and rethrows. So even if an intermediate caller swallows the
   rethrown error, the outermost frame still aborts. This is *nested
   poisoning*, and it is only one of **four** layers — see the section below.
4. **`onCommit` / `onAbort` are registered on the outermost context** regardless
   of the depth that registers them, and run **after** the commit or abort
   completes — never inside the transaction. This is where side effects that
   must not be inside a transaction go: cache revalidation, notification
   dispatch, webhook delivery, PDF generation. A throwing `onCommit` callback is
   logged and never turns a committed transaction into a failure.
5. **A transaction must never wrap an external call.** No HTTP, no Cloudinary
   upload, no Puppeteer render inside `fn`. MongoDB's default transaction
   lifetime is 60s and a held transaction blocks. Asset uploads happen *before*
   the transaction; asset cleanup happens in `onAbort`.

### Retry semantics — attempt-local versus final

A transient write conflict re-runs `fn` from the start. Codex found a real hole
in the first draft: it never said what happens to hooks, or to work done outside
the database, across attempts. Unspecified, the first failed attempt's `onAbort`
would delete an asset the retry still needs, and an `onCommit` registered on
attempt 1 would fire twice.

| Concern | Rule |
|---|---|
| `onCommit` / `onAbort` registrations | **Cleared before every retry.** Only the final attempt's registrations run. |
| `onAttemptFailed` | Runs after every failed attempt, including retried ones. The only hook for attempt-local cleanup. |
| Asset uploads and other external side effects | Happen **before** `withTransaction`, never inside. Compensating deletion is registered on `onAbort` (final), never `onAttemptFailed`. |
| Values that must be stable across attempts | Generated ids, timestamps, and anything random or clock-derived are computed **before** the retry loop and closed over — never inside `fn`. |
| Sequence allocation (MRN, invoice, encounter number) | Allocated inside `fn`. A rolled-back attempt rolls back the `$inc`, so a retry re-allocates cleanly. Safe **only** because allocation is a transactional document write; it would not be safe against an external sequence service. |
| Non-idempotent work | Must not be inside `fn`. If it cannot move out, it belongs in `onCommit`. |
| `fn` contract | **`fn` must be idempotent** — a documented precondition, not a hope. |
| Backoff | Exponential with jitter, strict attempt budget (default 3), and a retry-count metric so a contention pathology is visible rather than silent. |
| Parallel work inside `fn` | **Forbidden.** One Mongoose session cannot safely run concurrent operations. |

`depth` and `attempt` are frame-local metadata, not shared mutable counters — the
first draft's mutable `depth` would have been corrupted by two parallel nested
frames. That is moot once parallel work is forbidden, but the typing should not
invite it.

### Preventing a silent partial commit — four layers

This is the failure mode that matters most, and it deserves to be stated
precisely rather than hand-waved.

MongoDB has no notion of a "failed" transaction that is still open. If code
writes inside a transaction, throws, and the error is caught and discarded, the
transaction remains perfectly valid and **will commit the partial work**. No
amount of cleverness in `withTransaction` can observe an exception that never
reaches it. Consider exactly the case that breaks a naive design:

```ts
await withTransaction(async () => {
  await repoA.save(...);
  try {
    await someServiceThatWritesAndThrows();   // NOT wrapped in withTransaction
  } catch {
    // swallowed — the outer wrapper never sees this
  }
  await repoC.save(...);
});
```

If the only mechanism were "a nested `withTransaction` frame that throws marks
the context", this commits `repoA`'s write, whatever
`someServiceThatWritesAndThrows` managed to write before failing, and `repoC`'s
write. That is a silent partial commit, and it is unacceptable for a clinical or
financial record.

Four layers, in the order they fire:

**Layer 1 — repository writes mark rollback-only automatically.**
Every write executor (`executeSave`, `executeUpdate`, `executeDelete`,
`executeSoftDelete`, `executeSoftRemove`) wraps its operation so that on failure
it calls `getActiveTransaction()?.markRollbackOnly(error)` **before** rethrowing.

This is deliberately overbroad, and rule 9 below is the consequence: catching a
`DuplicateKeyError` inside a transaction and retrying with a different value does
**not** work, because the transaction is already poisoned. Making layer 1
selective was considered and rejected — classifying which write failures leave a
transaction usable is exactly the judgement call that produces silent partial
commits when someone gets it wrong.
This closes the common shape of the example above: if the throwing service
failed *at a repository write*, the transaction is already marked, and swallowing
the error changes nothing. This is the layer that does the most work in practice,
because inside a transaction most failures are write failures — duplicate keys,
validation errors, write conflicts.

**Layer 2 — a nested `withTransaction` frame that throws marks the context.**
As described in the nesting rules. Covers composed domain operations that are
themselves transactional.

**Layer 3 — explicit `tx.markRollbackOnly(error)`.**
For everything the first two layers cannot see: a failure in pure application
logic *after* a successful write, an external call, a validation the code
performs itself and decides to swallow. This is the caller's responsibility, and
it is the only part of the mechanism that depends on discipline.

```ts
await withTransaction(async (tx) => {
  await repoA.save(...);
  try {
    await riskyStep();
  } catch (error) {
    tx.markRollbackOnly(error);   // explicit, and the cause is retained
    // ...any local cleanup...
  }
});
```

**Layer 4 — explicit completion for write transactions.**
The review made a point the first draft missed: the residual gap is wider than
"a swallowed non-write failure". It also covers failures swallowed several frames
down, failed *reads*, invariant checks that return a sentinel instead of
throwing, an early `return` on a branch the author forgot, and writes made
outside the repository executors.

So a transaction that performs writes must **acknowledge success explicitly**:

```ts
await withTransaction(async (tx) => {
  const patient = await patientRepository.save(...);
  if (!someInvariant) return;          // ← forgetting to throw here...
  await auditRepository.save(...);
  return tx.complete(patient);         // ← ...means this never runs, so it aborts
});
```

`tx.complete(value)` returns a branded wrapper. If `fn` resolves with anything
other than that wrapper **and any write occurred in the transaction**, the
outermost frame aborts and throws `TransactionAbortedError`. A read-only
`withTransaction` needs no acknowledgement.

This catches the early-return and swallowed-sentinel classes, which layers 1–3
cannot.

**The residual gap, stated honestly.** A deliberate `catch {}` followed by a
deliberate `tx.complete()` commits partial work. Nothing can detect that. It is a
code-review problem, and the rules and QA check below are what address it.

### The transactional coding rules

These are rules, not guidance, and they exist because the residual gap above is
a discipline problem rather than a technical one.

1. **Do not swallow an error inside a transaction.** Let it propagate. Aborting
   is almost always the correct response to a failure mid-transaction.
2. **If you must catch, call `tx.markRollbackOnly(error)` in the same catch
   block**, before anything else. There is no third option.
3. **Never catch in order to "continue with partial success."** A transaction
   has no partial success. If a step is genuinely optional, do it *outside* the
   transaction — before it, or in an `onCommit` callback.
4. **Never call `session.commitTransaction()` / `abortTransaction()` /
   `startSession()` directly.** `withTransaction` owns the lifecycle.
5. **No external I/O inside `fn`** — no HTTP, no asset upload, no PDF render.
   Uploads happen before; cleanup goes in `onAbort`; notifications and cache
   revalidation go in `onCommit`.
6. **`fn` must be idempotent**, because a transient write conflict re-runs it
   from the start.
7. **No `Promise.all` or any parallel database work inside `fn`.** One session
   cannot safely run concurrent operations.
8. **A write transaction must end with `tx.complete(value)`.** An early return
   or a forgotten acknowledgement aborts.
9. **Do not try to recover from a repository error inside a transaction.**
   Probing a unique constraint and picking another value is legitimate *outside*
   a transaction and a defect inside one — layer 1 has already poisoned the
   transaction by the time you catch it. Move the probe before the transaction.

Enforcement: `scripts/qa/check-transaction-rules.ts` flags any `catch` block
lexically inside a `withTransaction` callback that neither rethrows nor calls
`markRollbackOnly`, and any direct `startSession`/`commitTransaction`/
`abortTransaction` outside the toolkit. It is a heuristic — a `catch` in a
function called from inside a transaction is invisible to it — so it is a
safety net over the rules, not a substitute for them.

### Error and rollback behaviour

| Situation | Behaviour |
|---|---|
| `fn` resolves, nothing poisoned | `commitTransaction()`, then `endSession()`, then run `onCommit` callbacks, then return `fn`'s value |
| `fn` throws | `abortTransaction()`, then `endSession()`, then run `onAbort(error)` callbacks, then **rethrow the original error unchanged** |
| `fn` resolves but the context is rollback-only | `abortTransaction()`, run `onAbort(rollbackCause)`, then throw `TransactionAbortedError` with `cause` set to the **first retained cause** — never a silent partial commit, and never a lost diagnostic |
| `markRollbackOnly` called more than once | Only the first cause is retained; later calls are no-ops on the cause. The abort happens once. |
| `markRollbackOnly` called with no cause | Aborts and throws `TransactionAbortedError` with a message naming the call site's absence of a cause, so a bare `markRollbackOnly()` is still diagnosable |
| `commitTransaction()` throws `UnknownTransactionCommitResult` | Retry the commit up to `maxRetries`; the label is explicitly retry-safe |
| Any op throws `TransientTransactionError` (e.g. write conflict) | Abort, then retry the **entire** `fn` from the start, up to `maxRetries`, with jittered backoff. `fn` must therefore be idempotent — documented as a hard requirement on the abstraction |
| Retries exhausted | Throw a **`ServiceUnavailableError` (503)** with a retryable code. **Not** 409 — a primary election, a timeout or cache pressure is not a business conflict, and reporting it as one misleads the caller and the operator alike. A genuine 409 is thrown by domain code *after* a successful retry finds a real conflict. |
| Transactions unsupported by the server (standalone `mongod`) | Throw `ConfigurationError` with the message naming the replica-set requirement and the local-dev fix. **Never silently run non-transactionally** |
| `abortTransaction()` itself throws | Log loudly and rethrow the *original* error, not the abort error — the original is the diagnostic one |
| `endSession()` throws | Logged, swallowed; it cannot change the committed/aborted outcome |

Two error classes are needed and do not exist: `TransactionAbortedError`
(500, `TRANSACTION_ABORTED`) and **`ServiceUnavailableError` (503,
`SERVICE_UNAVAILABLE`)** for exhausted transient retries — *not* `ConflictError`,
which is reserved for a genuine business conflict found after a successful retry.
`backend-toolkit-core/src/errors/` currently has 13 classes and no 429/422/402/503
— see [19](19-toolkit-and-package-changes.md).

### Which package it belongs in — and the split

The abstraction spans two packages, deliberately:

| Package | What goes in it | Why |
|---|---|---|
| **`@kira-joo/backend-toolkit-mongoose`** | `withTransaction`, `getActiveTransaction`, `TransactionContext` (incl. `markRollbackOnly`), the `AsyncLocalStorage` store, `resolveSession()`, the wiring of `resolveSession` into the seven executors, and the layer-1 auto-marking in the five write executors | `mongoose.ClientSession` is a Mongoose type. This package already owns every session-accepting code path, already has `mongoose` as a peer, and already has the `MongoMemoryReplSet` test harness. Putting it here means zero new dependencies anywhere. |
| **`@kira-joo/backend-toolkit-core`** | `TransactionAbortedError`; and the *contract* documentation on `FindCriteria.session` updated to say an ambient session may supply it | Core is ODM-agnostic and cannot reference `ClientSession`. It owns error classes. |
| **`@kira-joo/backend-toolkit-next`** | Nothing required. Optionally a `transaction: true` route-factory option in a later wave | Deliberately kept out of wave A: making the route factory open a transaction for every request would wrap reads in transactions for no benefit and would put revalidation inside the transaction. Transaction boundaries belong to the domain operation, not the HTTP layer. |

**Rejected placement:** a new `@kira-joo/backend-toolkit-transactions` package.
It would need `mongoose` as a peer, would have exactly one consumer, and would
split the session contract across a package boundary for no gain. The
`toolkit-first-development` skill's test — *"could an unrelated project use this
without knowing what a patient is?"* — is satisfied by putting it in
`backend-toolkit-mongoose`, which is already that generic.

### API surface changes, precisely

New files in `backend-toolkit-mongoose/src/repository/transaction/`:

```
transaction-context.interface.ts   TransactionContext, WithTransactionOptions
transaction-store.ts               the AsyncLocalStorage instance (module-private)
with-transaction.ts                withTransaction + retry loop + rollback-only
mark-rollback-only.ts              the rollback-only flag and cause retention
complete.ts                        tx.complete() branding + the write-occurred tracker
hooks.ts                           onCommit / onAbort / onAttemptFailed lifecycle
get-active-transaction.ts          getActiveTransaction
resolve-session.ts                 criteria.session ?? ambient ?? undefined
is-transient-error.ts              error-label predicates
index.ts                           barrel
```

Modified: the seven executors plus `create-mongoose-repository.ts` swap
`criteria.session` for `resolveSession(criteria.session)`. That is a
**one-line change per call site, 18 call sites**, and it is fully
backward-compatible: with no ambient transaction, `resolveSession` returns
exactly what was passed.

Semver: `backend-toolkit-mongoose` **0.3.3 → 0.4.0** (in this workspace the
`0.x` minor position carries breaking changes; nothing here is actually
breaking, but a new ambient-session behaviour is not a patch).

## Testing strategy

The harness already exists. `mongodb-memory-server@^11.2.0` is a devDependency
and `MongoMemoryReplSet.create({ replSet: { count: 1 } })` is already used at
`create-mongoose-repository.test.ts:606` and `execute-save.test.ts:144`. New
tests reuse that exact pattern, so there is no new infrastructure cost.

`with-transaction.test.ts` — required cases:

**Commit**
1. Two writes to two different collections inside one `withTransaction` are both
   visible after it resolves.
2. A read inside the transaction sees a write made earlier in the same
   transaction (already proven for explicit sessions; re-prove for ambient).
3. A read *outside* the transaction, taken while it is open, does **not** see
   the uncommitted write.
4. `onCommit` callbacks run once, after the commit, in registration order.
5. `withTransaction` returns `fn`'s resolved value unchanged.

**Rollback**
6. A throw after two successful writes leaves **both** collections unchanged.
7. The original error is rethrown, with its identity and type preserved
   (`instanceof`, message, `statusCode`), not wrapped.
8. `onAbort` receives that same error; `onCommit` callbacks do **not** run.
9. A `NotFoundError` thrown by `repository.findOne` mid-transaction aborts it.
10. A `DuplicateKeyError` from a `@Unique()` collision aborts it, and the
    translated 409 still reaches the caller.

**Ambient propagation**
11. A repository call made three function frames deep, with no `session`
    argument anywhere, joins the transaction.
12. An explicit `criteria.session` overrides the ambient one.
13. Outside any `withTransaction`, `getActiveTransaction()` is `null` and
    repositories behave exactly as they do today (regression guard).
14. Two concurrent `withTransaction` calls (`Promise.all`) do not see each
    other's sessions — the `AsyncLocalStorage` isolation test. This is the test
    that would catch a module-level-variable implementation mistake.

**Nesting**
15. A nested `withTransaction` reports `depth === 2` and shares the outer
    `session` object identity.
16. The nested call commits nothing; only the outer frame commits.
17. A throw inside the nested call rolls back writes made by the *outer* frame
    before it.
18. **Nested poisoning:** an inner `withTransaction` frame throws, an
    intermediate caller catches and swallows it, `fn` resolves — the transaction
    aborts and `TransactionAbortedError` is thrown. No partial commit.

**Rollback-only (layers 1 and 3)**
18a. **Layer 1:** a repository write fails, the caller swallows the error, `fn`
     resolves — the transaction aborts. Asserts the earlier successful write in
     the same transaction is **not** present afterwards. This is the exact case
     a naive design commits.
18b. **Layer 3:** `tx.markRollbackOnly(error)` in a catch block causes an abort
     even though `fn` resolved, and `TransactionAbortedError.cause` is the
     error that was passed.
18c. Only the **first** cause is retained across repeated `markRollbackOnly`
     calls at different depths.
18d. `markRollbackOnly()` with no cause still aborts and still produces a
     diagnosable error.
18e. `tx.isRollbackOnly` reads `false` before and `true` after.
18f. A rollback-only transaction runs `onAbort` and does **not** run `onCommit`.
18g. `markRollbackOnly` called at depth 2 aborts the depth-1 transaction.
19. `onCommit` registered at depth 2 runs after the depth-1 commit.

**Layer 4 — explicit completion**
19a. A write transaction whose `fn` resolves **without** `tx.complete()` aborts
     and throws; the write is absent afterwards. The early-return test.
19b. A read-only transaction needs no `tx.complete()` and commits normally.
19c. `tx.complete(value)` returns `value` unchanged to the caller.

**Retry**
20. A simulated `TransientTransactionError` on the first attempt causes `fn` to
    re-run and then succeed; the invocation count is asserted.
21. `maxRetries: 0` disables retry.
22. Exhausted retries surface as **`ServiceUnavailableError` (503)**, not 409.
22a. `onCommit` registered during a retried attempt fires **exactly once**.
22b. `onAbort` does **not** fire after an attempt that will be retried;
     `onAttemptFailed` does.
22c. A sequence `$inc` inside a retried `fn` consumes exactly one number.
22d. An explicit `criteria.session` differing from the ambient session throws.
22e. `Promise.all` over two repository writes inside a transaction is rejected by
     the QA check (static, not runtime).

**Environment**
23. Against a standalone (non-replica-set) `MongoMemoryServer`,
    `withTransaction` throws `ConfigurationError` naming the replica-set
    requirement — and does **not** fall through to a non-transactional write.

Application-side tests (Phase 0A brings the Node test project that makes these
possible — see [22](22-testing-and-qa.md)): each workflow in the table below
gets one commit test and one rollback test asserting that *no* collection
retains a partial write.

## Which first medical workflows require transactions

Ordered by risk. "Required" means the workflow must not ship without
`withTransaction`; the phase column says when it lands.

| # | Workflow | Collections written | Why it is mandatory | Phase |
|---|---|---|---|---|
| 1 | **Register patient** (identity + patient record + MRN allocation + audit) | `users`, `patients`, `mrnsequences`, `auditevents` | Today's `create-client.ts` compensating-delete is the exact defect this removes. MRN allocation must not burn a number on a failed registration, and must not hand two patients the same number. | 5 |
| 2 | **MRN allocation** | `mrnsequences` (+ the patient write) | A per-organization human-readable sequence. `findOneAndUpdate` with `$inc` is atomic on its own, but the allocation and the patient insert must succeed or fail together, or the sequence leaks. | 5 |
| 3 | **Update patient across identity + record** | `users`, `patients`, `auditevents` | `update-client.ts:24-33` splits one DTO across two collections and returns 200 on a half-write today. | 5 |
| 4 | **Delete / deactivate patient** | `patients`, `users`, `auditevents` | `delete-user.ts` currently soft-deletes satellites then hard-deletes the identity. With `User` gaining soft delete (M3) this becomes a coordinated state change across three collections. | 5 |
| 5 | **Book / reschedule appointment** | `appointments`, `auditevents`, (`waitinglist`) | Slot-conflict check and the write must be one atomic unit, or two receptionists double-book the same slot. The uniqueness constraint alone cannot express "no overlapping interval for this practitioner". | 6 |
| 6 | **Check-in** | `appointments`, `encounters`, `auditevents` | Check-in creates the `Encounter` and moves the `Appointment` state. An orphaned encounter with no appointment state change is a patient standing in a waiting room the system cannot see. | 6 |
| 7 | **Finalise / sign encounter** | `encounters`, `observations`, `diagnoses`, `prescriptions`, `patients` (alert denormalisation), `auditevents` | The widest write in the product, and the one where a partial commit is a clinical-safety issue: a signed encounter whose diagnoses did not persist. | 7 |
| 8 | **Record vitals / observations batch** | `observations`, `patients` (latest-value cache) | Write-through of latest values must match the observation rows. | 7 |
| 9 | **Nutrition calculation assignment** | `nutritioncalculations`, `encounters`, `auditevents` | The immutable-snapshot invariant depends on the snapshot and its link landing together. | 8 |
| 10 | **Log interaction with follow-up** | `contactattempts`, `patients` (`lastContactedAt`, `nextFollowUpAt`), `auditevents` | Exactly the stale-cache failure `create-client-interaction.ts` has today. | 9 |
| 11 | **Issue invoice** | `invoices`, `invoicelines`, `patients` (balance), `auditevents` | A header without lines, or lines without a balance update, is a billing dispute. | 10 |
| 12 | **Record payment** | `payments`, `invoices` (status + paid amount), `patients` (balance), `auditevents` | Money. Non-negotiable. | 10 |
| 13 | **Void / refund** | `payments`, `invoices`, `patients`, `auditevents` | Reversal must be all-or-nothing. | 10 |
| 14 | **Publish book edition** *(existing)* | `books`, `bookeditions` | Already guarded by optimistic `contentRevision` locking; retrofitting `withTransaction` closes the remaining window. Low priority, listed for completeness. | 12 |

Workflows that deliberately **do not** get a transaction: every read; every
single-collection write (`save` on one document is already atomic); asset
upload and Cloudinary cleanup (external I/O — these run outside and hook into
`onAbort`); cache revalidation (already deliberately post-commit and
best-effort in the route factory — moving it inside a transaction would be a
regression); PDF generation.

## Deployment and local development

Transactions require a replica set. This changes the local-dev story and must
be documented before Phase 3, not discovered during it.

| Environment | Requirement |
|---|---|
| Local dev | A single-node replica set. Either `mongod --replSet rs0` plus a one-time `rs.initiate()`, or a `docker compose` service with `--replSet`. To be added to `nutrition-staff/README.md` and `.env.example` guidance as part of Phase 0C. There is currently **no** container definition in any repo. |
| Tests | Already solved — `MongoMemoryReplSet`, already a devDependency and already in use. |
| Production | MongoDB Atlas and any managed replica set support transactions natively. A single self-managed `mongod` does not. This is a deployment prerequisite to record now, since no CI or infra config exists in any of the nine repos. |

`withTransaction` failing loudly on a standalone server (test case 23) is what
turns this from a silent-corruption risk into a setup error someone fixes in
five minutes.

## Prerequisites

- Phase 0A: the backend Node test project. `nutrition-staff/vitest.config.ts` is
  `jsdom`-only with no node project, so no backend test can run today.
- A local single-node replica set, per above.

## Downstream dependencies

Phases 3, 5, 6, 7, 9 and 10 all have workflows in the table above and cannot
meet their acceptance gates without this. Release wave A-backend must ship
`backend-toolkit-mongoose` 0.4.0 before Phase 3 begins.

## Implementation steps

1. Stand up a local single-node replica set; document it in
   `nutrition-staff/README.md`.
2. In `backend-toolkit-mongoose`, create the `repository/transaction/` module:
   store, context, `withTransaction`, `getActiveTransaction`, `resolveSession`,
   transient-error predicates.
3. Add `TransactionAbortedError` to `backend-toolkit-core`; release it first
   (dependency order), verified by `npm pack` + tarball install.
4. Route all 18 session call sites through `resolveSession`. No signature
   changes; `criteria.session` keeps precedence.
5. Write `with-transaction.test.ts` — all 23 cases above. Run the whole existing
   suite (49 test files) to prove no regression in the non-transactional path.
6. `npm run build && npm pack`; install the tarball into `nutrition-staff`;
   convert **one** workflow (`create-client.ts`) as the pilot, delete its
   compensating-delete, and write its commit and rollback tests.
7. Review the pilot with Codex before converting the rest.
8. Publish `backend-toolkit-core` then `backend-toolkit-mongoose` — each an
   explicit, separately-approved release. Revert the tarball reference and the
   lockfile in `nutrition-staff` first.
9. Convert the remaining five existing multi-write paths, each with commit and
   rollback tests. Every new workflow from Phase 3 onward is written
   transactional from the start.
10. Add `scripts/qa/check-transaction-rules.ts`: fails on `startSession` /
    `commitTransaction` / `abortTransaction` outside the toolkit, and on a
    `catch` lexically inside a `withTransaction` callback that neither rethrows
    nor calls `markRollbackOnly`. So the scattered pattern cannot reappear and
    the swallow-without-mark pattern is caught at review time.

## Acceptance criteria

- [ ] `grep -rn "startSession" nutrition-staff/src` returns **zero** hits.
- [ ] No `try`/`catch` in `nutrition-staff/src/server/**` exists solely to
      compensate for a failed second write.
- [ ] Every workflow in the mandatory table has a passing commit test **and** a
      passing rollback test that asserts no collection retains partial state.
- [ ] Test 14 (concurrent isolation) and tests 18/18a/18b (swallowed errors at
      every layer) all pass — these are the ones that catch an implementation
      that looks correct.
- [ ] A repository write failure that the caller swallows aborts the
      transaction (layer 1), proven by test 18a.
- [ ] `tx.markRollbackOnly` exists, retains the first cause, and surfaces it as
      `TransactionAbortedError.cause`.
- [ ] `scripts/qa/check-transaction-rules.ts` exists and fails a deliberate
      swallow-without-mark violation.
- [ ] `withTransaction` against a standalone server throws `ConfigurationError`,
      never a silent non-transactional write.
- [ ] `backend-toolkit-mongoose`'s existing 49 test files still pass unchanged.
- [ ] The local replica-set requirement is documented in
      `nutrition-staff/README.md`.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict: FLAWED — mechanism sound, semantics
underspecified. Amended.**

| # | Finding | Sev | Analysis | Resolution |
|---|---|---|---|---|
| 1 | `AsyncLocalStorage` is viable in Node App Router handlers; module-level repository singletons do not break it, because context resolves at call time. | — | Confirms the core choice. | No change. |
| 2 | "Every route is Node runtime" is an assumption, not an enforced invariant. | MAJOR | Correct — verified, `src/app/api/clients/route.ts:8` declares only `dynamic`. | **Accepted.** `runtime = "nodejs"` convention plus a static check, in Phase 0C. |
| 3 | `criteria.session ?? ambient` lets a caller inject a *different* session and silently split one operation across two transactions. | MAJOR | Correct, and a nasty failure mode. | **Accepted.** A differing explicit session now throws. |
| 4 | Propagation must cover populate, aggregation, bulk ops and raw model calls; a missed executor escapes. | MAJOR | Correct. Populate inherits the root query's session, but the newly proposed `aggregate`/`bulkWrite` surface would not without care. | **Accepted.** `resolveSession` applied at the lowest execution boundary; every new API in [19](19-toolkit-and-package-changes.md) must route through it. `tx.session` stays the documented raw escape hatch. |
| 5 | Auto-poisoning on every write error is overbroad — it breaks "probe a unique constraint, pick another value". | MAJOR | Correct that it is overbroad. But a selective version requires classifying which write failures leave a transaction usable, and a wrong classification produces exactly the silent partial commit this design exists to prevent. | **Accepted in part.** Overbreadth kept deliberately; rule 9 states the consequence plainly rather than leaving it to be discovered. |
| 6 | The residual gap is wider than stated — swallowed failures frames down, failed reads, sentinel returns, early returns. A fourth mechanism (explicit completion) would catch more. | MAJOR | Correct on both counts, and materially better than the first draft. | **Accepted.** Layer 4 `tx.complete()` added, with tests 19a–19c. |
| 7 | Mutable shared `depth` is corrupted by parallel nested frames; MongoDB cannot run parallel ops on one session anyway. | MAJOR | Correct. | **Accepted.** Parallel database work forbidden (rule 7) and checked; `depth`/`attempt` frame-local. |
| 8 | Retry semantics underspecified: hooks across attempts, generated ids, timestamps, sequence allocation. A first attempt's `onAbort` could delete an asset the retry needs. | CRITICAL | Correct, and the most useful finding here. The first draft said "must be idempotent" and left every practical consequence unstated. | **Accepted.** New *Retry semantics* section; `onAttemptFailed` added; hooks cleared per attempt; stable values hoisted out of the loop; sequence allocation analysed explicitly. |
| 9 | Hand-rolling the driver's retry loop is unnecessary risk. | MINOR | Correct — especially for `UnknownTransactionCommitResult`. | **Accepted.** The abstraction wraps `Connection#transaction()` and adds only ambient context, rollback-only, and hooks. |

**Also accepted from Area 1 of the review:** exhausted transient retries return
**503**, not 409.

**Still open:** whether `tx.complete()` should be required for *all* transactions
rather than only write transactions — universal is simpler to teach, noisier for
read-only use.

**A follow-up review of these amendments has not run** (Codex usage limit,
resets 2026-08-25). Queued questions, and a **mandatory gate before Phase 0C
implementation**: how is "a write occurred" tracked for the `tx.complete()` rule,
and can that tracking be fooled or produce a false abort? Does wrapping the
driver's own `Connection#transaction()` still permit per-attempt hook clearing
and rollback-only marking without fighting the driver's internal retry loop?
