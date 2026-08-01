"use client";

import { CustomForm, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { ActivityLevel, BmrFormula, Gender, NutritionGoal } from "../enums";
import { computeNutritionCalculationEndpoint } from "../../../api/nutrition-calculation.endpoints";
import { ComputeNutritionCalculationInputs, ComputeNutritionCalculationResponse } from "../interfaces/nutrition-calculation.interface";

export interface NutritionCalculationInputFormProps {
  defaultValues?: Partial<ComputeNutritionCalculationInputs>;
  onComputed: (response: ComputeNutritionCalculationResponse) => void;
}

/**
 * The workspace's single input set — one "Calculate" produces every
 * applicable result together (see runNutritionCalculation). Submits to the
 * stateless /compute endpoint; nothing is saved until a separate, explicit
 * save/assign action (owned by the caller) persists the returned snapshot.
 */
export function NutritionCalculationInputForm({ defaultValues, onComputed }: NutritionCalculationInputFormProps) {
  const biometricFields: FormFieldConfig<ComputeNutritionCalculationInputs>[] = [
    {
      type: FieldType.SELECT,
      name: "gender",
      label: "Gender",
      options: Object.values(Gender).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.SELECT,
      name: "bmrGenderOverride",
      label: "BMR sex override (only used if gender above is left blank)",
      options: Object.values(Gender).map((v) => ({ label: v, value: v })),
    },
    { type: FieldType.DATE, name: "dateOfBirth", label: "Date of birth" },
    { type: FieldType.INPUT, name: "birthYear", label: "Birth year (if exact date unknown)", inputType: "number" },
    { type: FieldType.INPUT, name: "heightCm", label: "Height (cm)", inputType: "number", rules: { required: true } },
    { type: FieldType.INPUT, name: "weightKg", label: "Weight (kg)", inputType: "number", rules: { required: true } },
    { type: FieldType.INPUT, name: "bodyFatPercentage", label: "Body fat % (enables Katch-McArdle)", inputType: "number" },
  ];

  const formulaFields: FormFieldConfig<ComputeNutritionCalculationInputs>[] = [
    {
      type: FieldType.SELECT,
      name: "bmrFormula",
      label: "BMR formula",
      options: Object.values(BmrFormula).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.SELECT,
      name: "activityLevel",
      label: "Activity level",
      options: Object.values(ActivityLevel).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.SELECT,
      name: "goal",
      label: "Goal",
      options: Object.values(NutritionGoal).map((v) => ({ label: v, value: v })),
    },
  ];

  const adjustmentFields: FormFieldConfig<ComputeNutritionCalculationInputs>[] = [
    { type: FieldType.INPUT, name: "goalAdjustmentPercent", label: "Goal calorie adjustment (%, e.g. -15)", inputType: "number" },
    { type: FieldType.INPUT, name: "goalAdjustmentKcalOverride", label: "Or a flat kcal adjustment instead", inputType: "number" },
    { type: FieldType.INPUT, name: "proteinGPerKgMin", label: "Protein range min (g/kg)", inputType: "number" },
    { type: FieldType.INPUT, name: "proteinGPerKgMax", label: "Protein range max (g/kg)", inputType: "number" },
    { type: FieldType.INPUT, name: "fatPercentOfCalories", label: "Fat (% of calories, default 25)", inputType: "number" },
    { type: FieldType.SWITCH, name: "acknowledgeBelowSafeFloor", label: "Acknowledge below safe-floor calories" },
  ];

  return (
    <CustomForm<ComputeNutritionCalculationInputs, typeof computeNutritionCalculationEndpoint>
      sections={[
        { title: "Biometrics", fields: biometricFields },
        { title: "Formula & activity", fields: formulaFields },
        { title: "Adjustments (optional overrides)", fields: adjustmentFields },
      ]}
      defaultValues={defaultValues}
      submitEndpoint={computeNutritionCalculationEndpoint}
      submitButtonText="Calculate"
      onSuccess={onComputed}
      layout="grid"
      columns={2}
    />
  );
}
