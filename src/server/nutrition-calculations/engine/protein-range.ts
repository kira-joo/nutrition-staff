import { NutritionGoal } from "src/common/enums";

/** Grams of protein per kg of current bodyweight per day, by goal — preserves lean mass during a deficit, supports muscle synthesis during a surplus. Tracks *current* weight, not the goal/target weight. */
export const DEFAULT_PROTEIN_G_PER_KG: Record<NutritionGoal, [number, number]> = {
  [NutritionGoal.WEIGHT_LOSS]: [1.6, 2.2],
  [NutritionGoal.MUSCLE_GAIN]: [1.6, 2.2],
  [NutritionGoal.MAINTENANCE]: [1.2, 1.6],
  [NutritionGoal.WEIGHT_GAIN]: [1.2, 1.6],
  [NutritionGoal.MEDICAL_MANAGEMENT]: [1.2, 1.6],
  [NutritionGoal.OTHER]: [1.2, 1.6],
};

export interface CalculateProteinRangeParams {
  weightKg: number;
  goal?: NutritionGoal;
  overrideMinGPerKg?: number;
  overrideMaxGPerKg?: number;
}

export function calculateProteinRange(params: CalculateProteinRangeParams) {
  const [defaultMin, defaultMax] = DEFAULT_PROTEIN_G_PER_KG[params.goal ?? NutritionGoal.MAINTENANCE];
  const minGPerKg = params.overrideMinGPerKg ?? defaultMin;
  const maxGPerKg = params.overrideMaxGPerKg ?? defaultMax;

  return {
    min: Math.round(params.weightKg * minGPerKg),
    max: Math.round(params.weightKg * maxGPerKg),
    unit: "g/day",
    gPerKgRange: [minGPerKg, maxGPerKg] as [number, number],
    formula: "goal-based-g-per-kg-bodyweight",
    formulaVersion: "1.0",
  };
}
