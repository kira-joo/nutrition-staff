# 08 — Platform foundation

**Status: APPROVED 2026-08-22.** Spread across Phases 3–5, with
notifications and search landing in Phase 11.

## Purpose

The cross-cutting capabilities every other module depends on: settings,
documents, notifications, global search, navigation, and the audit stream.

## Scope

Organization and branch settings UI · staff and practitioner management ·
documents and files with private delivery · in-app notifications ·
global search and the command palette · the module/navigation registry ·
the audit/activity surface.

Roles, permissions and the audit *schema* are [07](07-authorization-roles-permissions.md);
organization structure is [06](06-organization-and-branches.md). This document
covers what is left.

## Documents and files

### Current state
`AssetProvider` supports `"image"` and `"video"` only. Cloudinary's `"raw"`
resource type — PDFs, DOCX, anything else — is **unreachable**: there is no
`uploadDocument`/`uploadRaw`, no `DocumentAsset` type in `toolkit-common`, no
`documentAssetField()`. Every asset is uploaded with a public `secureUrl`: no
private or authenticated delivery, no signed URLs, no expiry, no access control.
A leaked URL is permanent unauthenticated access.

**This is an access-control flaw serious enough to block the clinical-document
feature.** A clinic cannot store a lab report or a scanned ID behind a permanent,
guessable-forever public URL that requires no authentication.

There is also no orphan cleanup — no reconciliation job, no reference counting.
Assets are embedded on their owning entity, so an update that replaces an asset
without calling `destroyAsset` leaks it. The app mitigates this with
`destroyReplacedAssets` per module and a `destroyAssetUnlessPublished` guard that
checks `BookEdition.referencedAssetPublicIds` and **fails open** on a query error
(documented as deliberate).

### Target state
- A `Document` entity ([04](04-domain-model.md) §8) — patient- and
  encounter-scoped, typed by `kind`.
- `DocumentAsset` in `toolkit-common` — an **opaque provider locator plus
  metadata, with no stored delivery URL**. A private URL must be generated per
  request; storing one makes it either permanently valid or permanently stale.
- `uploadDocument` in `backend-toolkit-cloudinary`, persisting the real resource
  type per upload rather than assuming `raw` (Cloudinary treats PDFs as `image`).
- **`createDownloadGrant(locator, {expiresInSeconds})`** — deliberately not
  called "get signed URL", because an ordinary signed Cloudinary URL proves
  authenticity without being time-limited. Expiry requires the private-download /
  token-authenticated mechanism, which is a different API. See
  [19](19-toolkit-and-package-changes.md).
- **A quarantine state.** A newly uploaded document is `PENDING_SCAN` and is not
  downloadable. MIME sniffing (content, not extension), extension/content
  agreement, and a malware scan must pass before it becomes `AVAILABLE`. The
  first draft deferred scanning; that was wrong — signed delivery stops the
  public from reading a document, and does nothing to stop a malicious PDF
  reaching a receptionist's laptop through a perfectly authorized download.
  A clinic receives files from patients by definition.
- Every document download is audited (`Document.download`, a custom permission
  action).
- Upload policies per `kind`: PDFs and images for lab reports, tighter limits
  for ID documents, with the existing `UploadPolicy` mechanism reused unchanged.
- Uploads happen **before** the enclosing transaction; cleanup is registered on
  `onAbort` ([05](05-transactions-and-data-integrity.md)).

### What private signed delivery does and does not achieve

Stated precisely, because it is easy to overclaim.

**It does** close the current access-control flaw: documents stop being
world-readable at a permanent URL, access requires an authenticated,
authorized, audited request, and the issued URL expires. That is a necessary
improvement and it is a genuine prerequisite for storing any patient document at
all.

**It also does not stop a grant being forwarded.** A download grant is a bearer
capability for its lifetime: whoever holds the URL can use it. Mitigations, all
required rather than optional — very short TTLs (seconds, not hours), no reliance
on referrer checks, `Cache-Control: private, no-store` on the granting route, and
every grant audited with the requesting actor.

### Two delivery modes, both supported, configurable per deployment

The asset abstraction supports **both**, and neither is forced globally:

| Mode | How | Trade-off |
|---|---|---|
| **Provider grant** | `createDownloadGrant(locator, {expiresInSeconds})`; the browser fetches from the provider | Cheap and fast. The grant is forwardable for its TTL. |
| **Proxy stream** | The application authorizes, fetches, and streams the bytes; no third-party URL ever reaches the browser | No forwardable URL and a per-request audit point. Costs bandwidth and execution time through the app server, which on a serverless deployment has real limits. |

**The most sensitive document `kind`s default to proxy streaming where
operationally viable** — identity documents and consent forms first. Everything
else uses a grant.

**Proxy streaming is deliberately not forced for every document.** Its bandwidth
and deployment cost has not been measured on the intended hosting, and mandating
it unmeasured would be a guess presented as a security decision. The choice is a
**deployment- and provider-level configuration** (`Organization.settings`
plus a provider capability flag), not a hardcoded domain rule — so a customer
whose requirements demand proxy-only can have it, and one whose bandwidth
constraints forbid it is not blocked. Measuring it is a Phase 5 task, and the
default per `kind` is revisited with that measurement in hand.

**It does not** make the system compliant for healthcare data. Confidentiality
of the delivery path is one control among many. Whether a given provider and a
given deployment are acceptable for patient data is **deployment- and
jurisdiction-dependent**, and turns on questions this plan cannot answer
generically:

- data residency — where bytes are physically stored and replicated
- the contractual position — a data-processing agreement, subprocessors,
  breach-notification terms
- retention and deletion guarantees, including from backups
- access logging on the provider side, not only in this application
- backup and restore arrangements, and who can read them
- encryption at rest and key custody
- the specific regulatory regime the customer operates under

Those are procurement and deployment decisions per customer, not architecture
decisions. This document therefore commits to two things only: signed private
delivery as the v1 implementation *if the provider review supports it for that
deployment*, and **keeping the `AssetProvider` abstraction clean so the provider
can be replaced where a customer's requirements demand it.** That interface
already exists in `backend-toolkit-core` and already documents that every upload
passes through the application server rather than direct-to-provider — which is
what makes substitution realistic.

Out of scope in v1: DICOM viewing, customer-managed encryption keys, retention
policy enforcement, legal hold, and provider-side access-log ingestion.
**Malware scanning is explicitly *in* scope** — moved in after review.

## Notifications

### Current state
None. `grep notification` across all seven packages returns one doc comment.
The only user feedback is the ephemeral `toast`.

### Target state
`Notification` + `NotificationPreference` ([04](04-domain-model.md) §8),
in-app only, with a bell and an unread count in the shell.

Events that notify in v1: an appointment booked or cancelled for a practitioner ·
a patient checked in · a task assigned · a follow-up overdue · an invoice
overdue · a practitioner licence expiring · a document uploaded to a patient the
actor is assigned to. Each is a row plus an `actionUrl`; nothing is pushed.

Email and SMS are **fields with no transport**. A `NotificationChannel` enum and
the preference flags exist so adding a transport later is a service, not a
migration. Stated plainly so nobody expects reminders to send.

Notification writes are registered as `onCommit` callbacks, never inside the
transaction — a failed notification must never roll back a clinical write.

**The reliability limit, documented rather than hidden.** An `onCommit` callback
runs after the transaction commits, in the same process. If the process dies
between the commit and the callback — a serverless instance frozen or recycled at
exactly that moment — **the notification is lost while the underlying write
stands.** For an in-app notification whose purpose is to draw attention to
something the user can also see on a worklist, that is an acceptable v1
tradeoff: the appointment still exists, the task is still assigned, and the
worklist still shows it.

**No outbox is built now.** There is no current requirement for
delivery-critical notification. The future path, recorded so it is a known
option rather than a rediscovery: write an outbox row **inside** the transaction
and have a separate worker deliver it with at-least-once semantics and
idempotency keys. That becomes necessary if and when notifications turn into
patient-facing reminders (SMS/WhatsApp appointment reminders are the obvious
trigger), because a missed patient reminder is a missed appointment. Until then,
an outbox would be infrastructure with no consumer. See
[24](24-future-expansion.md).

## Global search and the command palette

### Current state
No global search of any kind. No `cmdk` usage, no ⌘K, no shortcut registry.
Search is per-table only, via `FeatureTable`'s own `SearchInput`. Worse, patient
search today is a **two-hop unindexed regex**: `ClientProfile` has zero
`@Searchable` fields, so `list-clients.ts:11-18` runs an unanchored
case-insensitive `$regex` against `users.name/phone/email` and then `$in`s the
matched ids. That will not scale and it is the single most-used query in a clinic.

### Target state
- `Patient` gains `@Searchable` on `mrn`, and the two-hop regex is replaced by a
  proper index. A clinic searches by MRN, phone, and name — in that order of
  precision — so the search endpoint resolves an exact MRN or exact phone match
  first and only falls back to a name regex.
- `GET /api/search?q=` composes across patients, appointments, practitioners,
  invoices, documents and services, permission-filtered per entity, returning
  grouped results with a type discriminator. Backend-owned composition, per the
  workspace convention that made `GET /api/public/faq` the canonical example.
- A `CommandPalette` toolkit primitive (⌘K) with app-local result rendering —
  design in [17](17-ux-architecture-and-design-system.md), contract in
  [19](19-toolkit-and-package-changes.md). `cmdk` is already a dependency of
  `frontend-toolkit-tailwind`, used only inside combobox internals.
- Commands as well as records: "new appointment", "register patient", "go to
  today's schedule", "switch branch".

## The module and navigation registry

### Current state
Adding a module means four hand-synced edits: `src/common/routes/app-route.ts`
(84 flat route constants), an `api/<domain>.endpoints.ts`, a section block in
`src/common/navigation/side-nav.config.ts` (203 lines, 8 sections, 20 items,
each with a `permission`), and the page files. There is no registry; `AppRoute`
and the nav config are two independent lists kept in sync by hand.

The nav *is* genuinely role-aware and declarative, which is the good half — the
same permission strings gate nav items, `RouteButton`, row actions and route
tabs, filtered by `filterSideNavItems`.

### Target state
One module manifest per platform module and per vertical, co-locating routes,
nav entries, required permissions, and dashboard widgets:

```ts
export const patientsModule: PlatformModule = {
  key: "patients",
  navigation: [{ section: "clinical", items: [...] }],
  routes: { list: "/patients", detail: "/patients/[id]", ... },
  permissions: [AppPermission.PATIENT.READ],
  homeWidgets: [...],
};
```

`AppRoute` becomes derived from the manifests rather than maintained beside
them, so the two lists cannot drift. This is also what makes a vertical's nav
contribution ([12](12-vertical-extension-model.md)) work without editing a
platform file.

Breadcrumbs are added here too — there are none today (0 grep hits, and the
toolkit has no component), and the substitute is 44 literal `backRoute` props
with the toolkit's `BackRouteProvider` used zero times. Nested records
(patient → encounter → prescription) make a real trail necessary.

## Settings surfaces

Organization settings · branches and resources · practitioners and availability ·
staff · appointment types · services and discounts · encounter templates · roles
and permissions · notification preferences.

The current settings screens are 23–30-line form hosts with no grouping and no
"what does this affect" affordance. Settings for a sellable product need
sectioning, inline explanation, and a preview where a change is visible to
patients (an invoice header, a reminder template).

## Audit and activity surface

`GET /api/audit-events` with filters, plus two UI surfaces: an
organization-level activity feed for `clinic_admin`/`owner`, and a
**per-patient record-access history** — "who opened this patient's chart" — which
is the one a clinic will actually be asked about.

## Testing strategy

- Document upload/download: policy enforcement, signed-URL expiry, an
  unauthenticated URL failing, and every download audited.
- Search: MRN exact match wins over name partial; permission filtering excludes
  entities the actor cannot read; the previous two-hop regex path is gone.
- The module registry: a module with no `permissions` never renders nav; a
  manifest added in a test appears in the derived `AppRoute` set.
- Notifications: created on the listed events, `onCommit` only, never inside a
  transaction; a failing notification callback does not fail the request.

## Acceptance criteria

- [ ] No patient document is reachable without an authorized, **verifiably
      expiring**, audited grant.
- [ ] No stored asset record contains a delivery URL.
- [ ] A document is not downloadable until it has passed scanning.
- [ ] Both delivery modes work and are selectable per deployment and per document
      kind; neither is hardcoded.
- [ ] Proxy-streaming bandwidth cost is measured before the per-kind defaults are
      finalised.
- [ ] The plan documents provider suitability as a deployment decision, and the
      `AssetProvider` abstraction remains substitutable — no Cloudinary-specific
      type leaks into `platform/`.
- [ ] Patient search by MRN and by phone is index-backed; the two-hop regex is
      deleted.
- [ ] ⌘K opens, is fully keyboard-operable, and reaches every primary action.
- [ ] Adding a module requires editing exactly one manifest.
- [ ] Per-patient record-access history is queryable.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict: FLAWED. Amended.**

| # | Finding | Sev | Analysis | Resolution |
|---|---|---|---|---|
| 1 | An ordinary signed Cloudinary delivery URL is **not** inherently short-lived; expiry needs the private-download / token mechanism. `getSignedUrl(id, {expiresInSeconds})` conflated the two. | CRITICAL | Correct, and the API name encoded the confusion. | **Accepted.** Renamed `createDownloadGrant`; expiry asserted by an elapsed-TTL test rather than trusted. |
| 2 | `raw` is not a synonym for "document" — Cloudinary treats PDFs as `image`, and delivery and destruction both need the exact resource type, delivery type, format and version. | MAJOR | Correct. | **Accepted.** The provider determines and persists the real resource type per upload. |
| 3 | `DocumentAsset` persisting a `url` is wrong when private URLs must be generated. It also omitted delivery type, version, checksum, MIME type and original filename. | CRITICAL | Correct. | **Accepted.** Reworked to an opaque locator plus metadata, with no stored URL. |
| 4 | The current `AssetProvider` cannot deliver private assets at all — it only uploads image/video and destroys by `(publicId, resourceType)`. | MAJOR | Correct. **Verified** at `backend-toolkit-core/src/asset/asset-provider.interface.ts:17`. | **Accepted.** The interface is generalised in the same release, not just the Cloudinary implementation. |
| 5 | Cloudinary vocabulary is already leaking (`publicId`, `resourceType`, canonical `url`), making substitution expensive. | MAJOR | Correct. | **Accepted.** `assetKey`, `providerData`, `mediaKind`, `accessPolicy`, `createDownloadGrant`. |
| 6 | App-server authorization does not prevent post-issuance sharing of a grant. | MAJOR | Correct — a grant is a bearer capability. | **Accepted.** Very short TTLs, `no-store`, audited grants, and proxy streaming for the most sensitive kinds. |
| 7 | Deferring malware scanning is wrong for arbitrary uploaded documents. | MAJOR | Correct, and this was a genuine oversight: a clinic receives files from patients by definition, and signed delivery does nothing about content safety. | **Accepted.** Quarantine + MIME sniffing + scan moved **into** v1 scope. |

**Resolved (D10 in [25](25-risks-and-open-decisions.md)):** both modes stay
supported and configurable; the most sensitive kinds default to proxy streaming
where operationally viable; the bandwidth cost is measured before the defaults
are fixed rather than assumed either way.
