/** BMI-range method (18.5-24.9 x height^2) — chosen over historic IBW formulas (Devine/Hamwi/Robinson, dosing-oriented origin) because it stays consistent with the BMI thresholds already shown elsewhere in the same workspace, rather than introducing a second "ideal weight" concept with different numbers. */
export function calculateTargetWeightRange(heightCm: number) {
  const heightM = heightCm / 100;
  return {
    min: Math.round(18.5 * heightM * heightM * 10) / 10,
    max: Math.round(24.9 * heightM * heightM * 10) / 10,
    unit: "kg",
    formula: "bmi-range-18.5-24.9",
    formulaVersion: "1.0",
  };
}
