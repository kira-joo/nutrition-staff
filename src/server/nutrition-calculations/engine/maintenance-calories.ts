import { ActivityLevel } from "src/common/enums";

/** The single accepted convention for TDEE — matches nutrition-client's own public multiplier table exactly, for business-wide consistency. `maintenanceCalories` IS TDEE; deliberately exposed under one name, not two. */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

export function calculateMaintenanceCalories(bmrValue: number, activityLevel: ActivityLevel) {
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return {
    value: Math.round(bmrValue * activityMultiplier),
    unit: "kcal/day",
    activityMultiplier,
    formula: "tdee-standard-multiplier",
    formulaVersion: "1.0",
  };
}
