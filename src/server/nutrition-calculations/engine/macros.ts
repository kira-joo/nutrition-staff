export interface CalculateMacrosParams {
  goalCaloriesKcal: number;
  proteinGrams: number;
  fatPercentOfCalories?: number;
}

/** Protein is fixed from the protein-range calculation (its midpoint); fat is set as a physiological floor percentage of total calories rather than an arbitrary carb/fat split; carbs take the remainder. */
export function calculateMacros(params: CalculateMacrosParams) {
  const fatPercentOfCalories = params.fatPercentOfCalories ?? 25;
  const proteinGrams = Math.round(params.proteinGrams);
  const proteinKcal = proteinGrams * 4;
  const fatKcal = Math.round(params.goalCaloriesKcal * (fatPercentOfCalories / 100));
  const fatGrams = Math.round(fatKcal / 9);
  const remainingKcal = Math.max(0, params.goalCaloriesKcal - proteinKcal - fatKcal);
  const carbGrams = Math.round(remainingKcal / 4);

  return {
    proteinGrams,
    carbGrams,
    fatGrams,
    unit: "g/day",
    fatPercentOfCalories,
    formula: "protein-fixed-fat-floor-remainder-carbs",
    formulaVersion: "1.0",
  };
}
