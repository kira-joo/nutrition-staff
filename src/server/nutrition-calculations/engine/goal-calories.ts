import { BmrSex, NutritionGoal } from "src/common/enums";

/** Percentage-based defaults (scale with the individual, unlike a flat kcal cut) — doctor-overridable via `adjustmentPercent` or a flat `adjustmentKcalOverride`. */
export const DEFAULT_GOAL_ADJUSTMENT_PERCENT: Record<NutritionGoal, number> = {
  [NutritionGoal.WEIGHT_LOSS]: -15,
  [NutritionGoal.WEIGHT_GAIN]: 10,
  [NutritionGoal.MUSCLE_GAIN]: 10,
  [NutritionGoal.MAINTENANCE]: 0,
  [NutritionGoal.MEDICAL_MANAGEMENT]: 0,
  [NutritionGoal.OTHER]: 0,
};

/** Widely-cited safe floors — never recommended below this without an explicit doctor override. */
export const SAFE_FLOOR_KCAL: Record<BmrSex, number> = {
  [BmrSex.FEMALE]: 1200,
  [BmrSex.MALE]: 1500,
};

export interface CalculateGoalCaloriesParams {
  maintenanceCalories: number;
  goal?: NutritionGoal;
  adjustmentPercent?: number;
  adjustmentKcalOverride?: number;
  sex: BmrSex;
  acknowledgeBelowSafeFloor?: boolean;
}

export interface GoalCaloriesResult {
  value: number;
  unit: string;
  delta: number;
  method: "flat-kcal-override" | "percentage-of-maintenance";
  belowSafeFloor: boolean;
  safetyFloorKcal: number;
}

/**
 * Returns `null` when the computed value falls below the safe floor and
 * the doctor hasn't explicitly acknowledged it — the caller omits
 * goalCalories/calorieDelta/macros from the results and records why in
 * `assumptions`, rather than silently clamping to the floor (which would
 * quietly change the doctor's requested deficit) or silently recommending
 * an unsafe number.
 */
export function calculateGoalCalories(params: CalculateGoalCaloriesParams): GoalCaloriesResult | null {
  const { maintenanceCalories, goal, adjustmentPercent, adjustmentKcalOverride, sex, acknowledgeBelowSafeFloor } = params;

  let delta: number;
  let method: GoalCaloriesResult["method"];

  if (adjustmentKcalOverride !== undefined) {
    delta = adjustmentKcalOverride;
    method = "flat-kcal-override";
  } else {
    const percent = adjustmentPercent ?? DEFAULT_GOAL_ADJUSTMENT_PERCENT[goal ?? NutritionGoal.MAINTENANCE];
    delta = Math.round(maintenanceCalories * (percent / 100));
    method = "percentage-of-maintenance";
  }

  const value = Math.round(maintenanceCalories + delta);
  const safetyFloorKcal = SAFE_FLOOR_KCAL[sex];
  const belowSafeFloor = value < safetyFloorKcal;

  if (belowSafeFloor && !acknowledgeBelowSafeFloor) {
    return null;
  }

  return { value, unit: "kcal/day", delta, method, belowSafeFloor, safetyFloorKcal };
}
