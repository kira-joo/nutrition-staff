import { ActivityLevel, BmrFormula, BmrSex, Gender, NutritionGoal } from "src/common/enums";
import { calculateBmi } from "./bmi";
import { calculateBmr } from "./bmr";
import { calculateGoalCalories } from "./goal-calories";
import { calculateMacros } from "./macros";
import { calculateMaintenanceCalories } from "./maintenance-calories";
import { calculateProteinRange } from "./protein-range";
import { calculateTargetWeightRange } from "./target-weight-range";
import { calculateWaterIntake } from "./water-intake";
import { resolveAge } from "./resolve-age";

export const ENGINE_VERSION = "workspace-v1";

const MIN_SUPPORTED_AGE_YEARS = 10;
const MAX_SUPPORTED_AGE_YEARS = 110;

export interface NutritionCalculationEngineInput {
  gender: Gender;
  /** Only used when `gender` is `UNSPECIFIED` — an explicit, per-calculation choice, never inferred and never applied back to the client's stored profile. */
  bmrGenderOverride?: BmrSex;
  dateOfBirth?: Date;
  birthYear?: number;
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number;
  bmrFormula?: BmrFormula;
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
  goalAdjustmentPercent?: number;
  goalAdjustmentKcalOverride?: number;
  proteinGPerKgMin?: number;
  proteinGPerKgMax?: number;
  fatPercentOfCalories?: number;
  acknowledgeBelowSafeFloor?: boolean;
}

export interface NutritionCalculationEngineOutput {
  engineVersion: string;
  calculatedAt: Date;
  results: Record<string, unknown>;
  assumptions: string[];
}

/**
 * Runs every applicable calculator from one input set, per the workspace's
 * "provide inputs once, get related results together" design. Never
 * silently guesses a BMR sex coefficient when gender is unspecified, and
 * never silently recommends goal calories below the safe floor — both
 * cases omit the dependent outputs and explain why in `assumptions`
 * instead. `calculatedAt` is stamped once here and must be carried through
 * unchanged by the caller if the calculation is later persisted (an
 * assign action must never re-run this function).
 */
export function runNutritionCalculation(input: NutritionCalculationEngineInput, calculatedAt: Date = new Date()): NutritionCalculationEngineOutput {
  const assumptions: string[] = [];
  const results: Record<string, unknown> = {};

  results.bmi = calculateBmi(input.weightKg, input.heightCm);
  results.targetWeightRangeKg = calculateTargetWeightRange(input.heightCm);
  results.waterIntakeLiters = calculateWaterIntake(input.weightKg, input.activityLevel);
  results.proteinRangeGrams = calculateProteinRange({
    weightKg: input.weightKg,
    goal: input.goal,
    overrideMinGPerKg: input.proteinGPerKgMin,
    overrideMaxGPerKg: input.proteinGPerKgMax,
  });

  if (input.goal === NutritionGoal.MEDICAL_MANAGEMENT) {
    assumptions.push(
      "Goal is Medical Management — standard protein/calorie ranges may not apply; a medical condition should drive the plan instead of these defaults."
    );
  }

  const age = resolveAge(input.dateOfBirth, input.birthYear, calculatedAt);
  if (age?.isApproximate) {
    assumptions.push("Age approximated from birth year only (exact date of birth not provided).");
  }
  const ageOutOfSupportedRange = age !== null && (age.ageYears < MIN_SUPPORTED_AGE_YEARS || age.ageYears > MAX_SUPPORTED_AGE_YEARS);

  let sex: BmrSex | undefined;
  if (input.gender === Gender.MALE) sex = BmrSex.MALE;
  else if (input.gender === Gender.FEMALE) sex = BmrSex.FEMALE;
  else if (input.bmrGenderOverride) {
    sex = input.bmrGenderOverride;
    assumptions.push(
      `Gender is unspecified for this client — the doctor explicitly selected "${input.bmrGenderOverride}" as the BMR coefficient for this calculation only; the client's stored profile was not changed.`
    );
  }

  if (!sex) {
    assumptions.push(
      "BMR, maintenance calories, goal calories, and macros were not calculated: gender is unspecified and no BMR sex override was provided for this calculation."
    );
  } else if (!age) {
    assumptions.push(
      "BMR, maintenance calories, goal calories, and macros were not calculated: no date of birth or birth year was available."
    );
  } else if (ageOutOfSupportedRange) {
    assumptions.push(
      `BMR, maintenance calories, goal calories, and macros were not calculated: resolved age (${age.ageYears}) is outside the supported range (${MIN_SUPPORTED_AGE_YEARS}-${MAX_SUPPORTED_AGE_YEARS}) for these formulas.`
    );
  } else {
    let bmrFormula = input.bmrFormula ?? BmrFormula.MIFFLIN_ST_JEOR;
    if (bmrFormula === BmrFormula.KATCH_MCARDLE && input.bodyFatPercentage === undefined) {
      assumptions.push("Katch-McArdle was requested but no body-fat% was provided — used Mifflin-St Jeor instead.");
      bmrFormula = BmrFormula.MIFFLIN_ST_JEOR;
    }

    results.bmr = calculateBmr({
      formula: bmrFormula,
      sex,
      ageYears: age.ageYears,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      bodyFatPercentage: input.bodyFatPercentage,
    });

    if (!input.activityLevel) {
      assumptions.push("Maintenance calories, goal calories, and macros were not calculated: no activity level was provided.");
    } else {
      const bmrValue = (results.bmr as { value: number }).value;
      results.maintenanceCalories = calculateMaintenanceCalories(bmrValue, input.activityLevel);
      const maintenanceValue = (results.maintenanceCalories as { value: number }).value;

      const goalCalories = calculateGoalCalories({
        maintenanceCalories: maintenanceValue,
        goal: input.goal,
        adjustmentPercent: input.goalAdjustmentPercent,
        adjustmentKcalOverride: input.goalAdjustmentKcalOverride,
        sex,
        acknowledgeBelowSafeFloor: input.acknowledgeBelowSafeFloor,
      });

      if (!goalCalories) {
        assumptions.push(
          'Goal calories and macros were not calculated: the computed value falls below the standard safe floor for this sex. Enable "acknowledge below safe floor" to see it anyway.'
        );
      } else {
        results.goalCalories = goalCalories;
        results.calorieDelta = { value: goalCalories.delta, unit: "kcal/day" };
        if (goalCalories.belowSafeFloor) {
          assumptions.push("Goal calories are below the standard safe floor for this sex — shown only because the doctor explicitly acknowledged this.");
        }

        const proteinRange = results.proteinRangeGrams as { min: number; max: number };
        const proteinMidpoint = Math.round((proteinRange.min + proteinRange.max) / 2);
        results.macros = calculateMacros({
          goalCaloriesKcal: goalCalories.value,
          proteinGrams: proteinMidpoint,
          fatPercentOfCalories: input.fatPercentOfCalories,
        });
        assumptions.push(`Macros use the midpoint of the protein range (${proteinMidpoint}g/day) as the protein target.`);
      }
    }
  }

  return { engineVersion: ENGINE_VERSION, calculatedAt, results, assumptions };
}
