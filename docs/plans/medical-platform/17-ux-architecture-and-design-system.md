# 17 — UX architecture and design system

**Status: APPROVED 2026-08-22.** Phase 2 lands the foundation;
every feature phase ships its own polished surfaces on top of it.

## Purpose

Replace "sidebar + a page per resource" with a workspace product, and give the
staff app the visual and interaction language it has never had.

## Current state — measured, not impressionistic

The engineering is disciplined and the design is absent. Both are deliberate,
and the second is written down: `tailwind.config.js` is 28 lines with
`theme: { extend: {} }` and a 20-line comment explaining that this app defines no
theme of its own.

| Fact | Measurement |
|---|---|
| UI pages | 81 `page.tsx` + 3 layouts; **only 3 server components** in the whole app |
| Route-level states | **zero** `loading.tsx`, `error.tsx`, `not-found.tsx` |
| The entire visual vocabulary | `PageShell` (61 of 81 pages) + `PageSection` + `InfoRow` + `FeatureTable` + `CustomForm` |
| Interchangeable CRUD pages | **40** across 10 resources — list, 20-line create, 30-line update, `PageSection` detail, to the line |
| CSS custom properties defined in the app | **0** (`globals.css` is three `@tailwind` lines) |
| Typography system | none — no `next/font`, no `fontFamily`, no type scale. Headings are ad-hoc `text-3xl font-bold` / `text-2xl font-semibold` / bare `font-semibold` |
| Spacing scale | none — stock Tailwind, `gap-3/4/6` by convention |
| Dark mode | none |
| `motion` dependency | **absent**. 3 `transition-colors` in the app; 0 `animate-*`; 0 keyframes; **0 `prefers-reduced-motion`** |
| Responsive prefixes in the app | 29 `sm:`, 9 `lg:`, 1 `md:`, 0 `xl:`/`2xl:` |
| A11y attributes | ~64 across ~16k LOC, concentrated in 3 files. `htmlFor` appears **0 times** |
| Command palette / global search | none |
| Breadcrumbs | none (0 hits; the toolkit has none either) |
| `drawerPresentation` usage | **0**, though the toolkit ships it fully built |
| Tests | 1 file |

The app writes hundreds of raw `text-slate-500` / `text-red-600` /
`text-amber-700` utilities. Because the toolkit's `ROLE_DEFAULTS` happen to
*equal* stock Tailwind values, these look identical today and **break the moment
anyone themes this app** — which white-labelling requires.

Two screens prove the team can do information design when handed the problem:
`/dashboard` (period-over-period KPIs, follow-ups deliberately above the charts,
a success empty state) and `/clients/[id]/interactions` (a real timeline with
per-type icons and de-emphasised, non-editable system entries). The other ~77 are
the generic admin the brief is trying to escape.

And the patient context header — the single most important piece of chrome in a
medical product — is **name + a lifecycle chip**.

## Constraints, before any design

- **The staff app must not inherit `nutrition-client`'s visual identity.** The
  public site's redesign is a separate programme. This app gets its own language.
- The admin chrome is single-locale English/LTR, with no i18n and no locale
  routing — an existing decision. But it *authors* bilingual content, so
  per-element `dir="rtl"`, Arabic rendering and long-Arabic overflow are live
  concerns. A sellable product will eventually need a localized RTL chrome:
  **build nothing that blocks it** — logical properties everywhere, no
  hardcoded `left`/`right`, no text baked into images.
- Operational medical software optimises for speed, clarity, safety, context,
  keyboard efficiency and low cognitive load. The brief: *"Do not turn
  operational medical screens into cinematic marketing pages."*
- Toolkit-first. Generic UI goes to `frontend-toolkit-tailwind`; clinical
  composition stays local.
- The Books UI is preserved and out of scope.
- Verification is **measured DOM geometry** at 375/768/1440 plus computed
  contrast ratios. Not screenshots.

## 1. The shell architecture

Three regions, replacing the current sidebar + page model:

```
┌──────────────────────────────────────────────────────────────┐
│ Top bar: org/branch switcher · ⌘K search · notifications · me│
├──────────┬───────────────────────────────────────────────────┤
│ Nav rail │  Context bar   (patient banner, when in a record) │
│ (icons + │  ─────────────────────────────────────────────────│
│  labels, │                                                   │
│  role-   │  Work surface                                     │
│  filtered│                                                   │
│  by      │                                                   │
│  permis- │                                                   │
│  sion)   │                            ┌──────────────────────┤
│          │                            │ Contextual drawer    │
└──────────┴────────────────────────────┴──────────────────────┘
```

The **context bar** is new and is the architectural point: it persists across
every route inside a patient record, so navigating from Timeline to Billing never
loses who you are looking at. Today the patient header is re-rendered per tab
from a layout and carries two data points.

The nav rail keeps what already works — a declarative config array with a
`permission` per item, filtered by `filterSideNavItems` — and gains its entries
from module manifests instead of a hand-synced list
([08](08-platform-foundation.md)).

## 2. Role-based homes

| Role | Sees first | Deliberately absent |
|---|---|---|
| **Receptionist** | The day. A live board: arrivals, waiting with durations, who is with whom, next arrivals. Then today's takings and tasks due. | Clinical content beyond alerts; revenue analytics |
| **Doctor** | The worklist. My patients today in order with check-in state; **my unsigned drafts, oldest first**; abnormal results for my patients; my follow-ups due. | Revenue, CRM funnel, staff admin |
| **Nurse** | Vitals to take, patients waiting, tasks. | Diagnoses, billing |
| **Billing clerk** | Unpaid and overdue by age bucket; today's payments by method. | Clinical content |
| **Owner / clinic admin** | KPIs with previous-period deltas, revenue by branch and practitioner, utilisation, no-show rate, receivables ageing, follow-up compliance. | Nothing — this role sees everything |

Every home is composed from widgets declaring a required permission; a widget the
role cannot see is omitted, not errored. Verticals contribute widgets. Data
contracts are in [16](16-dashboard-and-reporting.md).

## 3. The patient record

### The clinical banner

Priority order, and this ordering is the design:

1. Name · MRN · age/sex
2. **Active high-severity alerts** — icon + text, never colour alone, never
   collapsed, never behind a tab
3. Assigned practitioner · clinical status if not `ACTIVE`
4. Next appointment · last visit
5. Outstanding balance
6. Phone, with call and WhatsApp actions

At 768 it drops to two rows. At **375** it becomes name + MRN + an alert
indicator, tappable to expand — an alert indicator is never hidden at any width.
A `DECEASED` or `MERGED` patient gets an unmissable full-width banner treatment,
because acting on the wrong record is the failure mode that matters.

### Tabs

Summary · Timeline · Appointments · Encounters · Observations · Documents ·
Billing · CRM · Profile · plus each enabled vertical's tab.

**Summary is a clinical summary, not a data dump.** The current Overview is a
`flex flex-wrap` of seven outline quick-action buttons over five info cards,
which becomes a seven-line stack on a phone. The replacement leads with: active
alerts, current medications, recent diagnoses, latest vitals with trend arrows,
next appointment, outstanding balance, next follow-up. Actions live in one
overflow menu and in the ⌘K palette, not as seven equal-weight buttons.

### The timeline

One merged, filterable, cursor-paged feed — sources and mechanism in
[09](09-patients.md). Entry types are distinguished by icon and a restrained
left-edge accent, following the pattern the existing interactions timeline
already gets right, including de-emphasising system-generated entries.

Note: the toolkit `Timeline` uses **physical** `border-l` / `pl-6` /
`-left-[29px]` and mirrors wrong under RTL. Fixed to logical properties in
release wave A-frontend.

### Charts belong on Observations

The Measurements screen today has no chart, on the one screen where longitudinal
trend is the entire point, while `LineChart` and `Sparkline` sit unused outside
the dashboard. Observations gets a per-definition trend chart with reference-range
bands, and the banner's latest vitals get sparklines.

## 4. The contextual interaction model

**The decision rule**, not a list of preferences:

| Use | When |
|---|---|
| **Drawer** | A focused task that needs the context behind it to stay visible, completes in under ~60 seconds, and returns you where you were. Log a contact attempt · book an appointment · take a payment · record vitals · add an alert or contact · schedule a follow-up · edit invoice lines. |
| **Modal** | A destructive or blocking confirmation, or a task that must not be abandoned half-done. Void an invoice · merge patients · sign an encounter. |
| **Inline edit** | A single field on a record already on screen, where a drawer would be heavier than the edit. |
| **Full page** | A long-form work surface with its own state and autosave: the encounter workspace, the calendar, list views, settings. |

The drawer already exists (`drawerPresentation`, focus-trapped, scroll-locking,
RTL-logical, promise-resolving via `openDialog`) and is used zero times. Adopting
it is pure app-side work with no package change — the highest value-to-effort
change in the whole UX plan. The superseded hardcoded-`z-50` `Modal` (still used
in 6 files) is retired in favour of the dialog system's layer coordinator.

## 5. Command palette and global search

⌘K / Ctrl+K opens a single surface that does both:

- **Records** — patients (MRN first, then phone, then name), appointments,
  invoices, practitioners, documents; grouped by type, permission-filtered.
- **Commands** — register patient, new appointment, today's schedule, switch
  branch, open settings.
- **Recents** — last patients and last commands, per user.

Fully keyboard-operable: arrows, enter, escape, and type-ahead groups. Never
requires a mouse. A `CommandPalette` primitive goes in the toolkit (`cmdk` is
already a dependency, currently used only inside combobox internals); result
rendering stays app-local. Contract in [19](19-toolkit-and-package-changes.md).

This is also the answer to "how does a receptionist do anything fast" — and it
removes the pressure to put seven buttons on every screen.

## 6. Scheduling UI

Design in [10](10-appointments-scheduling.md) §Screens. **The calendar is
app-local, after a library bake-off** — the earlier plan to ship a generic
`CalendarView` in the toolkit was reversed on review (the "no candidate handles
RTL" justification was false, and it is a product rather than a primitive). Every
appointment-shaped visual and all availability and conflict logic is app-local
regardless; toolkit extraction waits for a second consumer.

At 375 the answer is a **single-practitioner agenda list**, not a squeezed grid.
Choosing a different view is the honest response to a viewport that cannot hold
a time grid.

## 7. The design system

### Tokens

The app adopts the `--ftk-*` role contract instead of ignoring it — this is both
the design system and the white-label mechanism, since
`Organization.branding` can only drive variables the app actually reads.

Overridden roles, with intent:

| Role group | Direction |
|---|---|
| Surfaces | Three levels, low-chroma cool neutrals. A data-dense operational UI needs surfaces that recede; the current stock `slate-50` page on white cards is close to right and gains a third sunken level for nested panels. |
| Text | Four steps (primary/secondary/muted/placeholder), all ≥ 4.5:1 on their surface. |
| Brand | A single restrained primary used for **action**, never for decoration. The current `primary = #0f172a` (near-black) is a non-decision; a real primary is needed so a clinic's brand colour has somewhere to go. |
| Status | See the severity system below — the most important palette decision in the product. |
| Focus | A visible, high-contrast focus ring on every interactive element. Keyboard efficiency is a stated requirement, and it is unusable without this. |

Plus new token groups the toolkit does not yet expose: **density** (control
height, row height, font size — the existing `--ftk-control-height` at 2.5rem is
the seed), and **elevation** as a token set rather than ad-hoc shadows.

### The status and severity system

The one place where getting colour wrong is a safety issue. Two independent
scales, deliberately visually distinct so they are never confused:

- **Clinical severity** — `LOW / MODERATE / HIGH / CRITICAL`. Warm, escalating,
  and **always icon + text**, never colour alone. `CRITICAL` is the only place in
  the product allowed a filled high-chroma background.
- **Process state** — appointment status, invoice status, encounter status.
  Cool and neutral, low-chroma, with shape and label carrying the meaning.

Every pairing verified at ≥ 4.5:1 for text and ≥ 3:1 for UI boundaries, with the
computed ratios recorded in a table in the repo — the same discipline
`frontend-toolkit-tailwind/src/tailwind/roles.ts` already applies to its soft
status panels.

### Typography

There is nothing to migrate from. Choose one variable sans with real Arabic
coverage (the admin renders Arabic content constantly, in editors and previews),
loaded via `next/font` with `display: swap` and preloaded — currently there is no
font loading at all, so the app renders in a system stack. A six-step scale, tight
line-heights for data rows and looser for prose, tabular numerals for every
numeric column, MRN and money in a slightly condensed treatment so they scan.

### Density

An operational app benefits from a **compact / comfortable** toggle, persisted
per user, implemented purely by swapping the density token values. Reception wants
more rows; a doctor reading a chart wants air. This is a token change, not a
second component set.

### Migration from raw utilities

Mechanical and safe, because the role defaults currently equal the stock values —
so the migration is a no-op visually until the tokens change, which means it can
land ahead of the redesign rather than with it:

1. Map every raw utility in use to a role (`text-slate-500 → text-text-muted`).
2. Codemod, file by file, with `tsc` and the existing mobile-overflow QA script
   as the guard.
3. Add a lint rule banning raw colour utilities in `src/`.
4. **Only then** change the token values. The visual change lands in one commit,
   reviewable as one diff.

### White-labelling

`Organization.branding` (logo, favicon, primary, accent) emits a scoped
`<style>` block setting `--ftk-*` overrides at the app root. Contrast is
validated server-side on save — a clinic must not be able to configure an
unreadable UI. Only a bounded set of roles is customer-overridable; surfaces,
text and the severity scale are not.

## 8. States, accessibility, responsive

### States

Route-level `loading.tsx` and `error.tsx` for every segment — there are none
today. `QueryState` continues to handle in-page async. Skeletons stay composed
in the app rather than in the toolkit (the toolkit deliberately ships only a
`Skeleton` atom after a measured CLS regression, and that decision is respected):
one skeleton per layout shape, matching final geometry to avoid shift. Empty
states are specific and actionable, never "No data" — the dashboard's "nothing
needs attention" success state is the model.

### Accessibility remediation

Every form control gets a label with `htmlFor` (**0 occurrences today**) · every
icon-only button gets an `aria-label` (`interactions/page.tsx:553,562` are bare
`<button>`s containing only an icon) · a skip link · focus returned to the
trigger after a drawer or modal closes · a live region for toasts · one `<h1>`
per page and no heading-level skips (`books/[id]/front-matter/page.tsx:25` uses
`<h3>` with no `<h2>` above it) · `lang="ar"` alongside `dir="rtl"` on Arabic
content so screen readers switch voice · the 7 unlabelled raw `<textarea>`s in
`books/[id]/overrides/page.tsx` labelled · full keyboard operation of the
calendar, the palette and the board.

### Responsive

Not "does not break on mobile" — which is what it is today — but designed:

- **375**: the receptionist and nurse surfaces are genuinely usable. The agenda
  view replaces the calendar grid; wide tables become **card lists**, not
  horizontal scroll. `CustomTable` has no column-priority support today, so
  either a `priority` field on `TableColumn` (toolkit) or an app-level card
  renderer per list is required — decided in favour of the toolkit change, since
  every consumer needs it.
- **768**: the primary tablet target. Reception works on a tablet; this is not a
  degraded desktop.
- **Touch targets**: the toolkit's 40px control height is documented as *"a
  reasonable density for a desktop admin app and the wrong one for a public
  mobile form."* Resolution: the density tokens carry a **touch** tier at ≥44px,
  applied automatically below `md`. This satisfies the accessibility minimum
  without imposing mobile density on a desktop workstation.

## 9. New toolkit UI components

Each justified against *"could an unrelated project use this without knowing what
a patient is?"*

| Component | Verdict |
|---|---|
| ~~`CalendarView`~~ | **Removed.** Reversed on review — app-local after a library bake-off, extraction deferred to a real second consumer. See [19](19-toolkit-and-package-changes.md). |
| `CommandPalette` — **accessible shell only** | ✅ the `cmdk` dialog, focus and keyboard semantics, grouped items. The action registry, shortcut-conflict handling, async orchestration, permission filtering and recent/pinned persistence are app-local shell policy, narrowed on review. |
| `Breadcrumbs` | ✅ universal |
| Table: date-range / numeric-range / multi-select / boolean filters | ✅ closes the gap to the backend's 13 existing `FilterOperator`s |
| Table: column priority for responsive card collapse | ✅ |
| `MoneyInput` / `MoneyText` | ✅ — and formatting lives **here**, not in `toolkit-common`, which carries only `bigint` arithmetic. |
| `TagInput` | ✅ (the app hand-rolls comma-separated strings today) |
| `FormFieldArray` (repeatable groups) | ✅ (the app hand-rolls `array-field-editor.tsx`, which keys rows by index — a known latent bug its own sibling file documents) |
| `Avatar` / `AvatarGroup`, `Tooltip`, `Popover`, `Accordion`, `Stepper`, `SegmentedControl`, `ProgressBar` | ✅ ordinary primitives, none exist |
| `StatusBadge` (icon + label + variant, with a `size`) | ✅ `Badge` has no `size` and no icon slot |
| `DateRangePicker` | ✅ |
| Timeline: physical → logical properties | ✅ a correctness fix |

App-local compositions, explicitly **not** promoted: Patient Clinical Banner ·
waiting/check-in board · encounter workspace · vitals entry · diagnosis and
prescription entry · invoice line editor · appointment card and its status
visuals · every role home · every clinical severity mapping.

## 10. Phasing

**Phase 2, before any feature phase** — because retrofitting these is more
expensive than building on them, and because the brief forbids treating motion as
a final pass:

1. Token adoption + the raw-utility codemod (visually neutral).
2. Typography, density and elevation tokens.
3. The shell: top bar, nav rail from module manifests, context bar region.
4. The motion foundation ([18](18-motion-system.md)).
5. Drawer adoption for the flows that already exist.
6. Route-level loading/error states across the app.
7. The a11y remediation pass.

Then the token *values* change in one reviewable commit. Each feature phase
afterwards ships its own polished surfaces, with UX acceptance criteria in its
own document — not a design pass bolted on at the end.

## Acceptance criteria — measured

- [ ] No raw colour utility remains in `src/`; a lint rule enforces it.
- [ ] Every `--ftk-*` role the app uses is defined by the app, and white-label
      overrides apply at runtime with server-validated contrast.
- [ ] Computed contrast ≥ 4.5:1 for text and ≥ 3:1 for UI on every status and
      severity pairing, recorded in a committed table.
- [ ] No page-level horizontal overflow at 375, 768 or 1440, verified by DOM
      measurement (`scripts/qa/check-mobile-overflow.js`, extended to the new routes).
- [ ] Every interactive element has a visible focus ring; every flow is
      completable by keyboard alone.
- [ ] `htmlFor` present on every labelled control; zero unlabelled icon buttons.
- [ ] Patient alerts are visible at 375px without expanding anything.
- [ ] Touch targets ≥ 44px below `md`.
- [ ] Every route segment has `loading.tsx` and `error.tsx`.
- [ ] ⌘K reaches every primary action.
- [ ] First-render stability: no layout shift after hydration on the role homes,
      the calendar or the patient record.

## Codex findings and resolution

Not yet consulted. Ask: (a) is a persistent context bar worth its layout
complexity versus re-rendering a banner per route? (b) is the density toggle a
real need or a settings-screen ornament? (c) does the "codemod first, change
values second" migration genuinely de-risk the redesign, or does it just create
two large diffs where one would do?
