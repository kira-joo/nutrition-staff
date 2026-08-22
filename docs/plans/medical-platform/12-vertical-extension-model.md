# 12 — The vertical extension model

**Status: APPROVED 2026-08-22.** Phase 7, alongside encounters.

## Purpose

Let Nutrition, Dentistry, Dermatology, Physiotherapy or Paediatrics extend the
clinical workflow **without any of them appearing inside `platform/`**. This is
the mechanism that makes the product sellable to a clinic that is not a
nutrition clinic.

## Current state

There is no extension model. Nutrition is not a vertical — it is the product.
`NutritionAssessment` (33 fields, ~85% nutrition questionnaire),
`ClientMeasurement`'s 11 anthropometric fields, `NutritionCalculation` and its
10-file engine, and eight nutrition enums in `src/common/enums/` all sit as
first-class siblings of `users` and `roles`. Three of the five dashboard
attention lists (`noAssessment`, `noRecentMeasurement`,
`measurementWithoutCalculation`) are nutrition-workflow-specific and hardcoded.

`CalculationType` is an enum with exactly one member (`NUTRITION_WORKSPACE`) —
premature abstraction that gestures at this problem without solving it.

## Target state

### The shape of the answer: a hybrid, not a choice

Neither pure approach works.

| Approach | Why it fails alone |
|---|---|
| **Code-only** (a module per specialty, compiled in) | Cannot express "this clinic wants an extra field on its intake form" without a release. Every customer request becomes a code change. |
| **Data-only** (everything is a configurable form template) | Cannot express the nutrition calculation engine, its versioned formulas, its safety floors, or its typed provenance chain. Reduces real clinical logic to a form builder, and the audit found that engine is the most valuable IP in the repository. |

**The split, stated as a rule:** *typed behaviour is code; the long tail of
fields is data.*

- A vertical contributes **code** for: structured observation definitions,
  calculators and clinical algorithms, typed encounter sections with their own
  validation, dashboard widgets, navigation entries, and permissions.
- An **organization** contributes **data** for: additional questionnaire fields,
  section ordering, which sections apply to which appointment type, required/
  optional flags, and label overrides — via `EncounterTemplate`.

So Nutrition ships as code. "This dermatology clinic also wants to record
Fitzpatrick skin type" is a template field, no release required.

### The registration contract

One manifest per vertical, one registry in the platform. Nothing in `platform/`
imports a vertical; verticals import the platform's registry and register
themselves.

```ts
// platform/clinical-templates/vertical-registry.ts   (platform-owned)
export interface VerticalModule {
  /** Stable key. Persisted on Encounter.verticalKey, Observation.verticalKey,
   *  Service.verticalKey and Organization.features. Never renamed. */
  readonly key: string;
  readonly label: string;

  /** Observation definitions this vertical owns. Merged into the platform set;
   *  a key collision is a startup error, not a silent override. */
  readonly observationDefinitions: ObservationDefinition[];

  /** Typed encounter sections. Each declares its DTO, its renderer id, and its
   *  own validation. The platform stores the payload and knows nothing about it. */
  readonly encounterSections: EncounterSectionDefinition[];

  /** Calculators: pure, versioned, IO-free. */
  readonly calculators: CalculatorDefinition[];

  /** Extra permission entities/actions this vertical needs. */
  readonly permissions: PermissionDefinition[];

  /** Nav entries, added to the platform shell's registry. */
  readonly navigation: NavSectionConfig[];

  /** Reporting widgets contributed to the role dashboards. */
  readonly dashboardWidgets: DashboardWidgetDefinition[];

  /** Optional hooks. Called by the platform at defined lifecycle points. */
  readonly hooks?: {
    onEncounterSigned?(ctx: EncounterHookContext): Promise<void>;
    onPatientRegistered?(ctx: PatientHookContext): Promise<void>;
  };
}

export function registerVertical(module: VerticalModule): void;
export function getEnabledVerticals(organization: Organization): VerticalModule[];
export function resolveObservationDefinition(key: string): ObservationDefinition;
```

`EncounterSectionDefinition` is where the type safety lives:

```ts
export interface EncounterSectionDefinition<TPayload = unknown> {
  readonly key: string;                       // "nutrition.assessment"
  readonly label: string;
  readonly verticalKey: string;
  /** class-validator DTO. The platform runs it; it does not know the fields. */
  readonly payloadDto: ClassConstructor<TPayload>;
  /** Renderer id resolved by the frontend's section-component registry. */
  readonly rendererId: string;
  readonly appliesTo?: { encounterTypes?: EncounterType[]; appointmentTypeCodes?: string[] };
  readonly signRequirements?: (payload: TPayload) => string[];  // blocking reasons
}
```

### How this keeps routes, DTOs and repositories generic

`Encounter.sections` is an embedded array of
`{ key: string; schemaVersion: number; payload: unknown; updatedAt; updatedByUserId }`.

**`schemaVersion` is not optional and was missing from the first draft.** A
payload written against DTO v1 will eventually be read by a renderer and a
`signRequirements` function from v3. Stable section *keys* do not solve schema
evolution — only a persisted version does. Each `EncounterSectionDefinition`
therefore declares `version`, retains validators and renderers for every version
still present in data, and a version bump ships with an explicit migration or an
upcast function. A payload whose `schemaVersion` has no registered validator is
rendered read-only through the fallback renderer rather than being silently
reinterpreted.

The platform's `PUT /api/encounters/:id/sections/:key` route:

1. Looks the section definition up in the registry by `key`.
2. 404s if unknown; 403s if the vertical is not in `Organization.features`.
3. Runs `validateDto(definition.payloadDto, body)` — the **existing**
   `validateDto` from `backend-toolkit-core`, unchanged.
4. Writes the payload into the array.

So there is exactly one section *route* for every specialty forever. No
`platform/` file mentions nutrition, and adding a vertical adds no routes.

**But "exactly one write path" was false as originally stated,** and the review
was right to attack it. `repository.save` on an encounter, a generic encounter
update, migrations, seed scripts, imports, tests, and the `bulkWrite`/`updateMany`
surface being added in [19](19-toolkit-and-package-changes.md) can all replace the
embedded array without passing through the section route. Three enforcement
measures, since a convention is not a boundary:

1. **The generic encounter update DTO does not include `sections`.** With
   `whitelist: true` + `forbidNonWhitelisted: true` — already the `validateDto`
   default — a `sections` key in a generic update body is rejected outright, not
   silently stripped.
2. **Section writes go through one service function**, not through the
   repository directly, and the ESLint boundary rule forbids any file outside
   `platform/encounters/sections/**` from writing the `sections` path.
3. **A schema-level validator** on the array rejects an element whose `key` is
   unregistered or whose `schemaVersion` has no validator — so a migration or a
   raw write fails at the database, which is the only layer nothing can bypass.

Strict validation is specified centrally rather than assumed: nested payload
validation requires `@ValidateNested` plus `@Type`, and the section validator
sets `forbidUnknownValues`. `validateDto`'s existing defaults cover whitelist and
`forbidNonWhitelisted`; the nested and unknown-value behaviour is asserted by
test rather than inherited by luck.

This is deliberately the same pattern the workspace already sanctions and uses
twice: `createCachePolicyResolver` + an app-local `CACHE_POLICY`, and
`revalidateTags` + `config.cache.publishRevalidation`. A generic mechanism with
an app-supplied plugin point. The `toolkit-first-development` skill names it
explicitly.

**The escape valve, stated honestly:** `payload: unknown` in Mongoose means
`Mixed`, and the audit flagged unvalidated `Mixed` as a real defect
(`NutritionCalculation.inputs/results` are persisted verbatim from the client
today). The difference here is that the payload is **never** written without
passing its registered DTO, and there is exactly one code path that writes it —
so the validation cannot be bypassed by adding a new route. A size cap per
section (mirroring the Books subsystem's `assertBookSizeBudget`) prevents the
field becoming a dumping ground.

### Where a vertical's own collections live

Sections cover questionnaire-shaped data. A vertical with genuinely relational
data owns its own collections inside its own directory — `NutritionCalculation`
stays a collection, because it has a provenance chain (calculation ⇄
observation ⇄ assessment), an immutability requirement, and its own routes.

The rule: **a vertical may own collections; the platform may not know about
them.** Cross-references point one way — `NutritionCalculation.encounterId →
Encounter`, never `Encounter.nutritionCalculationId`.

### Enabling and disabling

`Organization.features: string[]`. A vertical not listed contributes no nav, no
sections, no widgets, and its routes 403. Disabling a vertical **never deletes
data** — existing encounters keep their sections and render read-only via a
generic fallback renderer.

**But disabling is not the same as removing the code**, and the first draft
conflated them. If a vertical's package is ever deleted from the build, its
renderer and DTO go with it and the promise of read-only rendering cannot be
kept. Two commitments, stated so the difference is explicit:

- **Disabled but present** (the supported case): the vertical's code is compiled
  in, `Organization.features` omits it, sections render read-only through the
  vertical's own renderer.
- **Removed entirely** (a deliberate, documented act): before removal, a
  **canonical rendering snapshot** is persisted on each affected section — a
  flat, human-readable label/value projection produced by the vertical's own
  renderer at removal time. That snapshot is what the generic fallback displays.
  Removing a vertical without producing the snapshot is prohibited, and the
  removal checklist is part of the vertical contract.

This matters because clinical history must remain readable for the retention
period regardless of what the clinic still offers.

### Frontend counterpart

A `SectionRendererRegistry` mapping `rendererId → React component`, populated by
each vertical's frontend module. The encounter screen iterates
`definition.appliesTo`-filtered sections and renders whatever the registry
returns, with a read-only JSON fallback for an unknown renderer. Same shape as
the existing `campaign-blocks` and `book-blocks` registries in `src/common/` —
so this is a pattern the codebase already runs twice and the team already knows.

### `EncounterTemplate` — the data half

`{organizationId, name, verticalKey?, encounterTypes[], sectionKeys[] (ordered),
customFields: TemplateField[], isDefault, status}`

`TemplateField` = `{key, label, type: TEXT|NUMBER|BOOLEAN|SELECT|MULTI_SELECT|DATE,
options?, required, unit?, helpText?, order}`. Values land in a reserved
`"custom"` section whose payload is a flat key/value map validated against the
template rather than against a compile-time DTO.

This is the boundary: a clinic gets fields without a release; it does not get
formulas, safety floors, or typed provenance without one.

## Nutrition as the reference implementation

Detailed in [13](13-nutrition-vertical.md). In summary:

| Nutrition asset today | Becomes |
|---|---|
| `NutritionAssessment` (33 fields) | encounter section `nutrition.assessment`, DTO unchanged, collection retained for history and for the `previousAssessmentId` chain |
| `ClientMeasurement`'s 11 anthropometric fields | 10 registered `ObservationDefinition`s (weight/height/BMI go to the platform) |
| `NutritionCalculation` + `engine/` (10 files) | a vertical-owned collection plus 4 registered calculators. **The engine files move byte-identical** and finally get tests |
| 8 nutrition enums in `src/common/enums/` | move into the vertical; nothing in `platform/` imports them |
| 3 nutrition dashboard attention lists | contributed `dashboardWidgets` |
| Recipes | the vertical's `patient-education` module |

## Explicitly out of scope

- A visual template designer. Templates are configured through ordinary CRUD
  screens in v1.
- Runtime-loaded verticals (plugins from disk or from a registry). Verticals are
  compiled in; the registry is for structure, not for dynamic loading.
- Per-vertical database schemas or connections.
- A second shipped vertical. Dentistry is used as a **design test** — "could this
  be added without editing `platform/`?" — and is not built.

## Edge cases

- **Two verticals claiming the same observation key** (both nutrition and
  physiotherapy want `body_fat_percentage`) → the definition belongs in the
  platform set, promoted the moment there is a second claimant. A collision is a
  startup error so the decision is forced rather than silently resolved.
- **A section removed from a template that existing encounters used** → data
  retained, rendered read-only.
- **A calculator version change** → `engineVersion` is already persisted on every
  `NutritionCalculation` snapshot and snapshots are never recomputed. That
  existing instinct is correct and becomes the rule for all verticals.
- **A vertical hook throwing during `onEncounterSigned`** → the signing
  transaction aborts. A vertical can therefore block a clinical action, which is
  intended (its `signRequirements` exist for exactly that) and must be
  documented, tested, and surfaced to the user as a specific reason rather than a
  500.

## Testing strategy

- The registry rejects duplicate vertical keys, duplicate section keys, and
  colliding observation definitions — at startup, loudly.
- A section payload written at `schemaVersion` 1 and read after a v2 definition
  ships renders through the v1 validator/renderer, not the v2 one.
- A payload whose `schemaVersion` has no registered validator renders through the
  fallback, and does not block reading the encounter.
- A generic encounter update containing `sections` is **rejected** (400), not
  silently accepted or stripped.
- A raw write of an unregistered section key fails at the schema validator.
- `signRequirements` is evaluated against the *persisted* section version, so a
  deployment does not retroactively change whether a signed encounter was valid.
- The section route: unknown key → 404; disabled vertical → 403; invalid payload
  → 400 with per-field errors; valid payload → persisted and re-readable.
- **The decisive test:** a throwaway `dentistry` fixture vertical, defined
  entirely in a test file, registers and produces a working encounter section
  without a single change under `platform/`. If that test needs a platform edit,
  the model has failed.
- The fallback renderer handles an unknown `rendererId` without crashing.
- A `signRequirements` failure blocks signing and names the reason.

## Acceptance criteria

- [ ] `grep -rn "nutrition" src/platform/` returns **zero** hits.
- [ ] The fixture-vertical test passes with no `platform/` changes.
- [ ] One section route serves every vertical, and no other code path can write
      `sections` — proven by the rejection tests and the boundary rule.
- [ ] Every persisted section carries `schemaVersion`, and a stale version still
      renders.
- [ ] Nutrition has lost no capability — verified field by field against
      [13](13-nutrition-vertical.md)'s inventory.
- [ ] A disabled vertical's historical data still renders.

## Prerequisites

[11](11-encounters-clinical-records.md) (the `Encounter` entity and its sections
array) and [04](04-domain-model.md).

## Downstream dependencies

Phase 8 ([13](13-nutrition-vertical.md)) is the first consumer.
[16](16-dashboard-and-reporting.md) consumes `dashboardWidgets`.

## Codex findings and resolution

**Reviewed 2026-08-22. Verdict on the original design: FATALLY FLAWED. Amended.**

| # | Finding | Sev | Analysis | Resolution |
|---|---|---|---|---|
| 1 | `sections.payload` as unconstrained `Mixed` is the same defect as `NutritionCalculation.inputs/results`, moved behind a convention — route validation helps, the database invariant remains unenforced. | CRITICAL | Substantially correct. Route-level validation is real protection against the API surface and no protection at all against migrations, seeds, imports and bulk writes. | **Accepted.** Three enforcement layers added, the load-bearing one being a **schema-level validator** — the only layer nothing bypasses. |
| 2 | "Exactly one write path" is false: `save`, generic updates, raw Mongoose, migrations, seeds, imports, tests, and the newly-planned `bulkWrite`/`updateMany` all bypass it. | CRITICAL | Correct, and the plan was adding bypasses in the same programme. | **Accepted.** `sections` excluded from the generic update DTO (rejected by `forbidNonWhitelisted`), a boundary rule confining writes to one service, plus the schema validator. |
| 3 | class-validator is not a complete unknown-object boundary unless nested validation, whitelist, `forbidNonWhitelisted` and `forbidUnknownValues` are all configured. | MAJOR | Correct. `validateDto` already sets whitelist and `forbidNonWhitelisted`; nested and unknown-value behaviour was assumed rather than specified. | **Accepted.** Specified centrally and asserted by test. |
| 4 | **Section schema versions are absent** — a v1 payload read by a v3 renderer. | CRITICAL | Correct, and a clear miss. Stable keys do not solve evolution. | **Accepted.** `schemaVersion` is now mandatory on every persisted section, with versioned validators and renderers and explicit upcasts. |
| 5 | `signRequirements(payload)` is current code, not the rules in force when the encounter was signed. | MAJOR | Correct — a deployment could retroactively change whether a signed record was valid. | **Accepted.** Signing evaluates against the persisted section version, and the definition version is snapshotted on the encounter. |
| 6 | The read-only-after-disable promise cannot be kept if the vertical's code is removed, since the renderer lives in it. | MAJOR | Correct. The draft conflated "disabled" with "removed". | **Accepted.** Two distinct cases; removal now requires persisting a canonical rendering snapshot first. |
| 7 | A code registry plus a DB template creates two authorities that can drift; for one built-in vertical, typed collections and routes would be simpler. | MAJOR | Half accepted. The drift risk is real and is now addressed. But specialty extensibility is the product requirement that makes this sellable to a non-nutrition clinic, so collapsing to typed-collections-per-specialty defeats the purpose. | **Accepted in part.** Drift addressed by versioning and by making a template referencing an unknown definition a startup error. And the largest nutrition payload — `NutritionAssessment` — **stays a typed collection**, not a section payload, so the highest-value clinical data is not behind `Mixed` at all. Sections carry the long tail. |

**Still open:** whether `EncounterTemplate`'s custom-field values should also
carry a version, or whether template-driven fields are inherently
schema-versionless because the template *is* the schema.
