function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

/**
 * The one calculator with no accepted alternative formula — this is the
 * definition of BMI, not a choice among competing equations. Category
 * thresholds are the standard WHO adult bands; a population-level
 * heuristic, not an individual diagnosis (e.g. athletes with high muscle
 * mass) — the doctor interprets.
 */
export function calculateBmi(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  const value = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  return {
    value,
    unit: "kg/m2",
    category: bmiCategory(value),
    formula: "bmi-standard",
    formulaVersion: "1.0",
  };
}
