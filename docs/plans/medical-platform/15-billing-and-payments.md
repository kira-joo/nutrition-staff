# 15 — Billing and payments

**Status: APPROVED 2026-08-22.** Phase 10.

## Purpose

Practical clinic billing: what a service costs, what a patient owes, what they
paid. Explicitly not accounting, and explicitly not insurance.

## Current state

**No billing exists.** The nearest thing is `Package` — pricing-page marketing
content with `pricingTiers.{month,quarter,half}`, a `variant`, an `icon`, a
`popular` flag and an `seoOverride`. It has no patient linkage, no invoice, no
payment, and no subscription mechanics. `ConsultationRequest.packageKey` is a
loose string, deliberately not a reference.

`Package` stays where it is, in `site-cms/`. It is website content that happens
to mention prices. Reusing it as a service catalogue would weld the public
pricing page to clinical billing, and a price change on the website would
retroactively alter historical invoices.

Two supporting gaps: `Currency` is an enum with exactly one member (`EGP`), and
there is **no money handling anywhere** in any of the seven packages — no `Money`
type, no minor-units convention, no formatter, no rounding helper, no currency
input. `KpiCard` has a `format?: (value:number) => string` prop whose doc comment
uses currency as an example, and that is the extent of it.

## Target state

`Service`, `Invoice`, `InvoiceLine`, `Payment`, `Discount` —
[04](04-domain-model.md) §7.

### Money, decided first

`Money { amountMinor: bigint; currency: string }` in `toolkit-common`. Integer
minor units, never a float, never a `Number` field holding `19.99` — and
`bigint` rather than `number`, because a lifetime of minor units can pass the
safe-integer limit and lose precision silently. With it: `addMoney`,
`subtractMoney`, `multiplyMoney` (explicit rounding mode), `allocateMoney`
(splitting a discount across lines without losing a piastre), `compareMoney`,
`zeroMoney`, and an **ISO 4217 exponent table** so a 3-decimal currency (JOD,
KWD) or a 0-decimal one (JPY) is correct rather than assumed to be 2.
Currency mismatch throws rather than coercing. Because `bigint` is not
JSON-native, an explicit `toMoneyJson`/`fromMoneyJson` pair crosses the API
boundary; DTOs carry the serialized form.

**Formatting and parsing are deliberately _not_ in `toolkit-common`.**
`formatMoney` mixes `Intl` presentation with domain arithmetic and lives next to
the UI as `MoneyText` in `frontend-toolkit-tailwind`; free-text money parsing
lives in the app's form layer, where the locale is actually known. A generic
`parseMoney` is a trap.

This is a genuine toolkit addition — any project with prices needs it — and it is
in release wave A so the billing phase cannot start by inventing floats.
See [19](19-toolkit-and-package-changes.md).

### Totals are server-computed, always

`Invoice.subtotal`, `discountTotal`, `taxTotal`, `total`, `paidTotal` and
`balance` are recomputed from `InvoiceLine` rows on every mutation, server-side,
and **never** accepted from a client. This is stated as a rule because it is the
single most common billing defect.

### Immutability, and how mistakes are fixed

- A `DRAFT` invoice is freely editable.
- An `ISSUED` invoice's lines are frozen. A correction is a **void and reissue**,
  or a credit note; never an edit.
- A `PAID` invoice is never edited under any circumstance.
- A `Payment` is append-only in spirit: a mistake is corrected by a reversing
  payment (`refundOfPaymentId`), not by editing history.

The same discipline as `Encounter` signing and `BookEdition` freezing — three
subsystems, one rule, which makes it learnable.

### Invoice numbering

Per-organization sequence, same mechanism as the patient MRN:
`findOneAndUpdate` with `$inc` and `upsert`, allocated **inside** the issuing
transaction. Two properties follow, and they are the ones being claimed:

- **the number is allocated on issue**, not at draft creation, so drafts that are
  never issued consume nothing;
- **a rolled-back issue does not consume a number**, and two concurrent issues
  cannot collide.

Format comes from `Organization.settings`. Numbering **policy** — whether
sequences must be strictly gap-free, per-branch, per-year, or formatted a
particular way — is jurisdiction- and customer-specific, and this design does not
attempt to settle it. The `scope` field on the sequence and the format template
in settings exist so the policy can be adapted later without a schema change.

### Discounts and the permission threshold

`Discount` supports percent or fixed, at invoice or line level, with an optional
cap and validity window. A discount above an organization-configured threshold
requires the custom `Invoice.discount` permission. This is a real clinic control
— a receptionist may waive 10%, not 60% — and it is one of the concrete
motivations for custom permission actions in
[07](07-authorization-roles-permissions.md).

### Packages, sessions and prepaid blocks

`Service.isSessionBased` + `sessionCount` covers "ten physiotherapy sessions,
paid up front". A `PatientServiceBalance` record tracks remaining sessions and is
decremented when an encounter consumes one. Deliberately minimal: no expiry
schedules, no transfer between patients, no partial refunds of a block. Anything
more is a subscription engine and is out of scope.

### Insurance seam, and nothing more

**There is no insurance seam at all** — no `Payer`, no policy, no eligibility, no
claim, no co-pay split, **and no `Invoice.payerId` field.** An earlier draft
carried a nullable `payerId` as a hook; it was removed on review because a
nullable reference to a nonexistent entity is domain vocabulary with no v1
behaviour, and insurance will arrive with a real `Payer` entity and a backfill
anyway. See [24](24-future-expansion.md).

## Workflows

**Bill an encounter.** `AppointmentType.defaultServiceIds` pre-fills a draft
invoice at check-in or at signing (organization-configurable). The practitioner
or the receptionist adjusts lines. Issue. That is the whole flow, and it is
short on purpose — a clinic that finds billing slow stops using it.

**Take a payment.** From the invoice, the patient record, or the waiting board
(paying on the way out is the common case). Transactional across `Payment`,
`Invoice` status and `paidTotal`, and `Patient.outstandingBalance` —
[05](05-transactions-and-data-integrity.md) workflow 12.

**Refund or void.** Reversing entries, reason required, audited, permission-gated.

**Chase a balance.** The outstanding-balance list feeds
[14](14-crm-and-followup.md)'s worklist and generates
`PAYMENT_REMINDER` contact attempts.

## Screens

`/billing/invoices` (list, with status and age) · `/billing/invoices/[id]` ·
`/billing/payments` (a day's takings — what reception reconciles at closing) ·
`/settings/services` · `/settings/discounts` · `/patients/[id]/billing`.
Payment entry and invoice-line editing are **drawers**. Receipts print via the
existing `renderHtmlToPdf` in `backend-toolkit-next` and the repo's established
manual-handler pattern for binary responses.

## APIs

`GET/POST /api/services` · `GET/PUT/DELETE /api/services/:id` ·
`GET/POST /api/invoices` · `GET/PUT /api/invoices/:id` ·
`POST /api/invoices/:id/issue|void` ·
`POST /api/invoices/:id/lines` · `PUT/DELETE .../lines/:lineId` ·
`GET /api/invoices/:id/pdf` ·
`GET/POST /api/payments` · `POST /api/payments/:id/refund` ·
`GET/POST /api/discounts` ·
`GET /api/patients/:id/balance` ·
`GET /api/reports/revenue?from=&to=&branchId=&practitionerId=`.

Action endpoints rather than a status PUT, for the same reason as appointments:
each transition has its own guards and audit action.

**Issue, payment, refund and void all require an `Idempotency-Key`**
([04](04-domain-model.md) §8). This is the clearest case in the product: a
double-submitted payment form produces two `Payment` rows, two balance
decrements and a refund conversation. Transaction retries do not help — these are
two separate requests. A replayed key returns the stored response.

## Validation and business rules

An invoice requires at least one line to be issued · quantities > 0 · a discount
cannot exceed the subtotal · a payment cannot exceed the outstanding balance
without an explicit overpayment flag · a refund cannot exceed what was paid ·
currency must match the organization's · a voided invoice cannot receive a
payment · tax is a per-line rate, with no tax engine.

## Audit

Every invoice and payment write, every void, every refund, and every discount
above the threshold — with the actor, the reason, and the before/after totals.
Financial audit is non-negotiable and is the least ambiguous case for the
`AuditEvent` stream.

## Edge cases

Overpayment (allowed with a flag, producing a patient credit balance) · payment
against a merged patient (re-points to the winner) · a session-based service
consumed with no sessions left (blocked, with an offer to sell another block) ·
an invoice for a `DECEASED` patient (allowed — estates settle bills) · a
same-day void and reissue keeping both numbers (correct; the gap is the audit
trail) · a partial payment across two methods (two `Payment` rows, one invoice) ·
rounding: `allocateMoney` guarantees the parts sum to the whole.

## Testing strategy

Money arithmetic including the allocation-remainder case · totals recomputed and
never trusted from the client · invoice-number uniqueness under concurrency · no
number burned on a rolled-back issue · payment transactionality across three
collections with a forced failure in each · balance denormalisation matching the
sum of invoices minus payments (a property test) · refund cannot exceed paid ·
discount threshold enforcement · every state transition, legal and illegal.

## Acceptance criteria

- [ ] No float is used for money anywhere.
- [ ] Invoice numbers are allocated on issue, never consumed by a rolled-back
      issue, and never collide under concurrency.
- [ ] Totals are always server-computed.
- [ ] Payment recording is atomic across payment, invoice and patient balance.
- [ ] `Patient.outstandingBalance` provably equals invoices minus payments.
- [ ] An issued invoice cannot be edited; a paid one cannot be touched.
- [ ] Discounts above the threshold require the permission.

## Codex findings and resolution

Not yet consulted. Ask: (a) is the denormalised `Patient.outstandingBalance`
worth its consistency risk versus computing it on read? (b) should invoice
numbers be allocated at draft or at issue, given gap-free expectations?
(c) is `PatientServiceBalance` the minimum viable session model, or does it need
expiry from day one?
