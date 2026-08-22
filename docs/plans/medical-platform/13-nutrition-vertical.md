# 13 — The nutrition vertical

**Status: APPROVED 2026-08-22.** Phase 8.

## Purpose

Move Nutrition out of the platform core and into a vertical **without losing a
single capability**, and give the calculation engine the tests it has never had.

The brief is explicit: *"Do not destroy existing Nutrition capabilities merely to
make things generic."* This document is the inventory that proves nothing was
lost.

## Current state and disposition

| Asset | Files / detail | Disposition |
|---|---|---|
| `NutritionAssessment` | `src/server/assessments/**`, 7 files. 33 fields: goal, activity level, sleep quality/hours, smoking, alcohol, occupation, work schedule, dietary pattern, pregnancy/breastfeeding status, water intake, meals per day, digestive/appetite/lifestyle/general notes, plus 7 `string[]` fields (medical conditions, medications, supplements, allergies, food intolerances, preferred/disliked foods). Auto-resolves `previousAssessmentId`. | Becomes encounter section `nutrition.assessment`. **Collection retained** — the `previousAssessmentId` chain and the "compare to previous" affordance depend on it. DTO unchanged. |
| Anthropometry | 11 numeric fields on `ClientMeasurement` + `bodyCompositionMethod` | Weight, height, BMI → **platform** `ObservationDefinition`s. Waist, hip, chest, neck, arm, thigh, body-fat %, muscle mass, body water %, visceral fat level → **10 nutrition-registered definitions**. |
| Calculation engine | `src/server/nutrition-calculations/engine/**`, 10 files | **Moves byte-identical.** Registered as 4 calculators. |
| `NutritionCalculation` | 17 files total; immutable snapshots with `engineVersion`, `inputs`, `results`, `assumptions[]`, and a provenance chain to a measurement and an assessment | Vertical-owned collection. `inputs`/`results` gain DTO validation (they are unvalidated `Mixed` today). |
| Nutrition enums | `src/common/enums/`: `nutrition-goal`, `activity-level`, `bmr-formula`, `body-composition-method`, `sleep-quality`, `smoking-status`, `alcohol-use`, `calculation-type` | Move into the vertical. Nothing in `platform/` may import them. |
| Recipes | `recipes`, `recipe-categories`, `recipe-food-groups` + `POST /api/recipes/export-pdf` | `verticals/nutrition/patient-education/`. Public endpoints unchanged. See [03](03-target-architecture.md) for why not `site-cms`. |
| Dashboard attention lists | `noAssessment`, `noRecentMeasurement`, `measurementWithoutCalculation` in `get-dashboard-attention.ts` | Contributed `dashboardWidgets`. The other two (`notContactedRecently`, `incompleteProfile`) are generic and stay in the platform. |
| Calculator page | `/calculators` standalone + assign modal | Vertical route. |
| `targetWeightKg` | on `ClientProfile` today | Moves to a vertical care-plan record, not the platform `Patient`. |

## The engine — preserved exactly, and finally tested

The engine is the most valuable IP in the repository and the least protected.
Ten files of pure, IO-free, deterministic arithmetic that encode **clinical
safety rules**, with **zero tests**.

| File | Formula, with provenance |
|---|---|
| `bmi.ts` | `weight / height_m²`, `"bmi-standard"` v1.0, WHO bands at 18.5/25/30 |
| `bmr.ts` | Three alternatives: **Mifflin-St Jeor** (1990, default) `10w + 6.25h − 5a` +5♂/−161♀; **revised Harris-Benedict** (1984); **Katch-McArdle** (1996) `370 + 21.6 × leanMass`, which throws without a body-fat percentage |
| `maintenance-calories.ts` | `bmr × ACTIVITY_MULTIPLIERS` = 1.2 / 1.375 / 1.55 / 1.725 / 1.9 — a comment records that this matches `nutrition-client`'s public multiplier table exactly, which is a cross-repo contract worth preserving deliberately |
| `goal-calories.ts` | Percent-of-maintenance or a flat override. `SAFE_FLOOR_KCAL` ♀1200 / ♂1500 — **returns `null` below the floor unless `acknowledgeBelowSafeFloor`, and never silently clamps** |
| `protein-range.ts` | `DEFAULT_PROTEIN_G_PER_KG`: loss/muscle `[1.6, 2.2]`, otherwise `[1.2, 1.6]`, × current weight |
| `macros.ts` | Protein at the range midpoint (4 kcal/g), fat at 25% of kcal (9 kcal/g), carbs as the remainder (4 kcal/g) |
| `target-weight-range.ts` | `18.5 × h_m²` … `24.9 × h_m²`; a comment records rejecting Devine/Hamwi/Robinson for consistency |
| `water-intake.ts` | `0.035 × weightKg`, `+0.5 L` when ACTIVE or VERY_ACTIVE |
| `resolve-age.ts` | DOB → exact; else `birthYear` → `isApproximate: true`; else `null` |
| `run-nutrition-calculation.ts` | Orchestrator, `ENGINE_VERSION = "workspace-v1"`. Gates age to 10–110; skips the BMR chain with no gender; skips the maintenance chain with no activity level; falls back from Katch-McArdle to Mifflin when body-fat % is absent — appending an explanatory string to `assumptions[]` for **every** skip |

**Required tests** — this is the single highest-value test debt in the codebase:

1. Each of the three BMR formulas against published reference values.
2. Katch-McArdle throwing without body-fat %, and the documented fallback to
   Mifflin *with* the assumption string asserted.
3. `SAFE_FLOOR_KCAL`: below-floor returns `null`; with
   `acknowledgeBelowSafeFloor` returns the value; **never** a clamped number.
4. Age gating at exactly 10, 9, 110, 111.
5. Every `assumptions[]` string, asserted by content — they are the clinical
   audit trail and are currently untested prose.
6. Macro arithmetic: protein + fat + carbs kcal sums to the goal within rounding
   tolerance; the fat floor holds; carbs never go negative at a low goal.
7. WHO BMI band boundaries at 18.5, 25.0, 30.0 exactly.
8. Activity-multiplier parity with `nutrition-client`'s public table — a
   cross-repo drift guard, in the spirit of the existing
   `check-mark-renderer-parity.ts`.
9. `resolve-age` across DOB, `birthYear`, and neither.
10. Target-weight range arithmetic.
11. Determinism: the same inputs produce byte-identical results, and
       `engineVersion` is stamped.

These tests are written **before** the move, so the move is provably behaviour-
preserving. They land in Phase 0A, not Phase 8 — the engine does not need to be
a vertical to be tested.

## Registration manifest

```ts
export const nutritionVertical: VerticalModule = {
  key: "nutrition",
  label: "Nutrition",
  observationDefinitions: [
    waistCircumference, hipCircumference, chestCircumference, neckCircumference,
    armCircumference, thighCircumference, bodyFatPercentage, muscleMass,
    bodyWaterPercentage, visceralFatLevel,
  ],
  encounterSections: [
    { key: "nutrition.assessment", payloadDto: NutritionAssessmentSectionDto,
      rendererId: "nutrition-assessment", signRequirements: requireGoalAndActivity },
    { key: "nutrition.plan", payloadDto: NutritionPlanSectionDto,
      rendererId: "nutrition-plan" },
  ],
  calculators: [bmrCalculator, maintenanceCalculator, macroCalculator, hydrationCalculator],
  permissions: [ /* NutritionAssessment.*, NutritionCalculation.*, Recipe.* */ ],
  navigation: [ /* Recipes, Calculators */ ],
  dashboardWidgets: [noAssessmentWidget, staleMeasurementWidget, measurementWithoutCalculationWidget],
  hooks: { onEncounterSigned: maybeCreateFollowUpTask },
};
```

Weight and height are **not** in the list — they are platform observations. This
is the concrete proof the split works: nutrition reads platform observations for
its calculations and adds only what is genuinely nutrition-specific.

## Fixing the two defects while moving

**1. `NutritionCalculation.inputs`/`results` are unvalidated `Mixed`.**
`create-nutrition-calculation.ts` persists whatever the client POSTs, without
re-running the engine. Not re-running is correct — the snapshot must never be
rewritten. Accepting arbitrary client-supplied "clinical results" is not. Fix:
typed DTOs for both, validated on write, plus a server-side recompute compared
against the submitted values, rejecting a mismatch. The snapshot stays immutable;
it just has to be *the engine's* snapshot.

**2. Duplicated BMI math.** The formula is written three times — in
`create-client-measurement.ts`, in `update-client-measurement.ts`, and in
`engine/bmi.ts`. The engine version becomes the single source; the derived BMI
observation is produced by calling it.

## Screens

`/patients/[id]/nutrition` — the vertical's patient tab: assessment history with
a real side-by-side comparison (the current "Compare to previous" button only
*navigates* to the previous assessment, despite its label), anthropometry with
longitudinal charts, calculations with their provenance chain.
`/recipes/**` unchanged. `/calculators` unchanged.

## Backward compatibility

- All 18 public endpoints, including `/api/public/recipes`, unchanged.
- `nutrition-client`'s recipe filtering, taxonomy and pagination contracts
  unchanged.
- Books' `RECIPE_REF` blocks and `BookEdition.recipeSnapshots` unchanged — Books
  is permitted to import from the vertical's patient-education module, recorded
  as an explicit exception in [03](03-target-architecture.md).
- Existing `NutritionAssessment` and `NutritionCalculation` rows keep their
  `_id`s. `encounterId` is added as nullable and backfilled where an encounter
  can be inferred from the same-day appointment; otherwise left null.
  Historical rows without an encounter render on the patient timeline via their
  own dates.

## Migrations

M9 — the `ClientMeasurement` split. Each existing measurement row fans out into
up to 12 `Observation` rows sharing an `observedAt` and a group id, with
`heightCmUsed` preserved into `derivationInputs`. The source collection is
**retained read-only** for one release rather than dropped, so the split is
verifiable against it. Detail in [20](20-migration-strategy.md).

## Testing strategy

Beyond the 11 engine test groups: the split migration is idempotent and
lossless (row counts and value-by-value comparison against the retained source);
a disabled nutrition vertical still renders historical sections read-only; the
assessment section validates through the registry path; the recompute-on-write
check rejects a tampered `results` payload.

## Acceptance criteria

- [ ] `grep -rn "nutrition" src/platform/` returns zero hits.
- [ ] Every one of the 33 assessment fields, 11 measurement fields, 4 calculators
      and 8 enums is accounted for in the table above and works after the move.
- [ ] The engine has tests for all 11 groups, including every `assumptions[]`
      string and the safe-floor refusal.
- [ ] BMI is computed in exactly one place.
- [ ] `NutritionCalculation.inputs`/`results` are validated and recompute-checked.
- [ ] Assessment comparison is a real side-by-side, not a navigation.
- [ ] Public recipe endpoints byte-identical; Books unaffected.

## Codex findings and resolution

Not yet consulted. Ask: (a) does the recompute-and-compare check break any
legitimate historical case where the engine has since changed version?
(b) should `NutritionAssessment` remain its own collection or become purely an
encounter section payload, given the `previousAssessmentId` chain? (c) is
retaining `ClientMeasurement` read-only for a release the right hedge, or does it
guarantee two sources of truth for a release?
