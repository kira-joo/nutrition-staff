# 18 — Motion system

**Status: APPROVED 2026-08-22.** Foundation in Phase 2; each
feature phase ships its own layer-appropriate motion.

## Purpose

A motion contract for **operational medical software** — where motion earns its
place by communicating state, direction and causality, and where a decorative
animation is a defect.

The brief is unambiguous: *"Motion should serve clarity and state, especially in
medical operational interfaces"* and *"Do not turn operational medical screens
into cinematic marketing pages."* It also forbids treating animation as a final
cosmetic pass, which is why this is a Phase 2 foundation rather than a Phase 12
polish.

## Current state

Effectively nothing, and nothing to migrate from.

| Fact | Measurement |
|---|---|
| `motion` / `framer-motion` in `nutrition-staff` | **not a dependency** |
| Animation utilities in the app | **3** — two `transition-colors`, one false positive |
| `animate-*`, keyframes, `globals.css` animation | **0** |
| `prefers-reduced-motion` / `motion-safe:` / `motion-reduce:` | **0 occurrences** |
| Motion the user actually sees | the toolkit's sidebar drawer `transition-transform duration-200`, and whatever the spinner/skeleton/toast do internally — none of it reduced-motion gated at the app level |

For contrast, `nutrition-client` has `motion@^12.43.0`, `predev`/`prebuild` hooks
generating motion CSS from a token file, and a documented six-layer motion
contract in `docs/motion-system.md`. That document is the model for **rigour**,
not for content — a marketing site and a waiting-room board have opposite goals.

`nutrition-staff/CLAUDE.md:243` already states that animation work is
non-negotiable on reduced-motion, RTL, accessibility, performance and
first-render stability. That policy has produced no code in this app. This
document is how it starts producing code.

## Constraints

- **Motion (`motion`, imported as `motion/react`) is the stack of record.** Never
  `framer-motion`. GSAP is retired workspace-wide and must not return; no second
  animation engine alongside Motion.
- **Prefer CSS and native transitions wherever they suffice.** Motion is added
  as a dependency for the cases CSS genuinely cannot do — orchestration, shared
  layout, exit animations, gesture-driven movement. Most of this system is CSS.
- Search the Motion documentation before writing Motion code (the `motion` skill
  and its MCP server are enabled at workspace scope).
- Every duration and easing is a token. No hardcoded `300ms`, no inline cubic
  bézier.
- Reduced motion is not a fallback bolted on afterwards; it is defined per layer.

## The layered contract

Six layers, ordered from "always on" to "never in this app".

### Layer 0 — Instant (no motion)

Anything under ~80 ms of perceived work, and anything where delay costs safety or
speed: form field focus, checkbox and radio state, table row hover, keyboard
navigation between calendar cells, ⌘K result highlight movement.

**Rule: never animate a keyboard-driven selection change.** A clinician arrowing
through results at speed must not be waiting on a transition.

### Layer 1 — Micro-feedback (CSS only, 80–140 ms)

Confirms that an input registered. Button press, toggle, chip selection, hover
elevation, focus-ring appearance.

CSS `transition` on `background-color`, `border-color`, `color`, `opacity`,
`box-shadow`, `transform: scale`. Never on layout properties.
Reduced motion: durations → 0; the end state still applies.

### Layer 2 — State transition (CSS or Motion, 140–220 ms)

The workhorse layer, and the one that carries clinical meaning. A change in the
*status of something real*: an appointment moving `WAITING → WITH_PRACTITIONER`
on the board · an alert appearing on the patient banner · an invoice becoming
paid · a task completing · an observation flagged abnormal.

The motion communicates **what changed and where it went**. A card moving between
board columns animates its position so the eye follows it; it does not fade out
and fade in somewhere else, because that loses the causal link — which on a
waiting board is the entire information content.

Motion is used here (not CSS) where an element must animate *between containers*
— `layoutId` / shared-layout is the one thing CSS cannot do.

Reduced motion: **the position change is instant, and a brief non-motion
emphasis (a background flash on the destination) replaces it.** The user must
still be told something moved. Removing the animation must not remove the
information — this is the most important reduced-motion rule in the document.

### Layer 3 — Surface entry and exit (Motion, 180–260 ms)

Drawers, modals, popovers, the command palette, toasts, the notification panel.

Direction carries meaning: a drawer enters from the **logical** inline edge
(`inline-end` in LTR, mirrored automatically in RTL — the toolkit's
`drawerPresentation` already handles this correctly), a modal scales from 0.98
with a fading backdrop, the palette drops 8px and fades.

Exit animations are the reason Motion is needed at all here — React unmounts
before CSS can transition out. The toolkit's dialog system already owns focus
trapping, scroll locking and layering, so this layer is animation only.

Reduced motion: opacity-only, 100 ms. Never zero — a surface appearing with no
transition at all reads as a rendering glitch.

### Layer 4 — Content and list transition (Motion, 200–300 ms, budgeted)

Timeline entries appearing on "load older" · list reordering after a sort ·
tab-panel content swaps · a row being removed after deletion.

**Strictly budgeted.** Staggers are capped at ~6 items and ~24 ms apart; beyond
that the list appears at once. A 200-row table never animates — animating a large
list is slower and less legible than not.

Reduced motion: no stagger, no movement; opacity only, or nothing.

### Layer 5 — Explicitly forbidden in this app

Scroll-triggered reveals · parallax · decorative background motion · counting-up
numbers on a clinical KPI (a number that animates is a number a clinician has to
wait to read) · page-level slide transitions between routes · looping animation
of any kind · anything longer than 300 ms outside a deliberate, reviewed
exception.

`nutrition-client` legitimately uses several of these. This app does not, and the
separation is the point.

## Tokens

```
--motion-duration-instant   0ms
--motion-duration-micro     120ms
--motion-duration-state     180ms
--motion-duration-surface   220ms
--motion-duration-content   260ms

--motion-ease-standard      cubic-bezier(0.2, 0, 0, 1)      /* most things */
--motion-ease-decelerate    cubic-bezier(0, 0, 0, 1)        /* entering */
--motion-ease-accelerate    cubic-bezier(0.3, 0, 1, 1)      /* exiting */
--motion-spring-state       spring, low bounce               /* layer 2 only */
```

One source of truth, following the pattern `nutrition-client` already uses
(a token file, not scattered literals). No component defines its own duration.
Whether these become `--ftk-*` roles in the toolkit or stay app-level is decided
in [19](19-toolkit-and-package-changes.md); the app-level answer ships first.

## Reduced motion

A single `useReducedMotion`-driven provider supplies the resolved token set, so a
component never branches on the media query itself. Per-layer behaviour is in the
table above. The rule that governs all of it:

> **Reduced motion removes movement, never information.** If an animation was
> carrying meaning — something moved, something changed, something arrived — the
> reduced-motion path must convey the same thing by another means.

## Performance and first-render stability

- Animate only `transform` and `opacity`. Never `width`, `height`, `top`, `left`,
  or anything triggering layout.
- No `will-change` left permanently on an element.
- The waiting board and the calendar are the two surfaces at risk: both can hold
  dozens of moving items. Both are budgeted, and both are audited with the
  MotionScore runtime audit before their phase closes.
- **No entry animation on first paint.** A role home, the calendar and the
  patient record must render in their final position. An animation that plays on
  every page load is a tax the user pays repeatedly, and it is
  indistinguishable from layout shift.
- Animation never delays interactivity: a drawer's content is focusable as it
  enters, not after.

## Where motion earns its place — the specific cases

| Surface | Layer | What it communicates |
|---|---|---|
| Waiting board card moving between columns | 2 (shared layout) | *This* patient is now with *that* doctor. The highest-value motion in the product. |
| Wait-duration badge escalating severity | 2 | This has been waiting too long |
| Patient banner alert appearing | 2 | A safety-critical fact just became true |
| Drawer / modal / palette entry and exit | 3 | Where this surface came from, and that it is layered over context |
| Optimistic mutation feedback | 1–2 | The action registered, before the server confirms |
| Timeline "load older" | 4 | New content arrived below, not replaced |
| Calendar drag-to-reschedule | 2 | Direct manipulation; the block follows the pointer |
| Toast entry | 3 | Something happened, non-blocking |
| Skeleton → content | 1 | Loading resolved. Opacity only, matched geometry, no shift |
| Sort / filter reorder | 4, budgeted | The same rows, in a new order |

## Testing and verification

- Reduced-motion behaviour is verified per layer with the preference enabled, not
  assumed.
- First-render stability measured: no layout shift after hydration on the role
  homes, the calendar and the patient record.
- MotionScore runtime audit on the waiting board and the calendar with a
  realistic item count before those phases close.
- The forbidden list is enforced by review, and by a lint rule banning raw
  duration and easing literals in `src/`.
- Keyboard-driven selection changes are asserted to be instant.
- RTL: drawer and board direction verified by **measuring element positions** in
  a real browser, not by reading CSS — per the browser-visual-qa bar.

## Acceptance criteria

- [ ] `motion` added to `nutrition-staff`; `framer-motion` and GSAP absent from
      source, `package.json` and the lockfile.
- [ ] Every duration and easing comes from a token; a lint rule blocks literals.
- [ ] Every layer's reduced-motion behaviour implemented and verified, and no
      reduced-motion path loses information.
- [ ] Zero entry animation on first paint of any primary surface.
- [ ] Only `transform` and `opacity` are animated.
- [ ] Waiting board and calendar pass a MotionScore audit at realistic scale.
- [ ] No forbidden-layer motion anywhere in the staff app.
- [ ] Keyboard navigation is instant everywhere.

## Codex findings and resolution

Not yet consulted. Ask: (a) is Motion justified as a dependency at all here, given
how much of this contract is CSS — or is the shared-layout board card the single
case, and is that worth the bundle? (b) is the reduced-motion "flash instead of
move" substitution genuinely accessible, or is it its own problem for
photosensitive users? (c) is a 6-item stagger cap the right budget?
