import { ActivityLevel } from "src/common/enums";

/** 35ml/kg/day (common clinical default) plus a fixed activity adjustment for Active/Very Active levels — the midpoint of the commonly-cited 350-700ml range. */
export function calculateWaterIntake(weightKg: number, activityLevel?: ActivityLevel) {
  const activityAdjustmentLiters =
    activityLevel === ActivityLevel.ACTIVE || activityLevel === ActivityLevel.VERY_ACTIVE ? 0.5 : 0;

  const value = Math.round((weightKg * 0.035 + activityAdjustmentLiters) * 10) / 10;

  return {
    value,
    unit: "L/day",
    activityAdjustmentLiters,
    formula: "35ml-per-kg-plus-activity-adjustment",
    formulaVersion: "1.0",
  };
}
