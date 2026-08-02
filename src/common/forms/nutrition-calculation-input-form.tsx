"use client";

import { CustomForm, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { computeNutritionCalculationEndpoint } from "../../../api/nutrition-calculation.endpoints";
import { ActivityLevel, BmrFormula, Gender, NutritionGoal } from "../enums";
import {
  ComputeNutritionCalculationInputs,
  ComputeNutritionCalculationResponse,
} from "../interfaces/nutrition-calculation.interface";

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
  const form = useForm<ComputeNutritionCalculationInputs>({
    defaultValues: {
      acknowledgeBelowSafeFloor: true,
      bmrFormula: BmrFormula.MIFFLIN_ST_JEOR,
      goal: NutritionGoal.WEIGHT_LOSS,
      ...defaultValues,
    },
  });

  const dateOfBirth = form.watch("dateOfBirth");

  // birthYear only exists as a fallback for when the exact date is unknown —
  // once dateOfBirth is set, it's derived and locked rather than left to
  // silently disagree with the real date.
  useEffect(() => {
    if (!dateOfBirth) return;
    const year = new Date(dateOfBirth).getFullYear();
    if (!Number.isNaN(year)) form.setValue("birthYear", year);
  }, [dateOfBirth, form]);

  const biometricFields: FormFieldConfig<ComputeNutritionCalculationInputs>[] = [
    {
      type: FieldType.SELECT,
      name: "gender",
      label: "Gender",
      options: Object.values(Gender).map((v) => ({ label: v, value: v })),
    },
    { type: FieldType.DATE, name: "dateOfBirth", label: "Date of birth" },
    {
      type: FieldType.INPUT,
      name: "birthYear",
      label: "Birth year (if exact date unknown)",
      inputType: "number",
      disabled: Boolean(dateOfBirth),
    },
    { type: FieldType.INPUT, name: "heightCm", label: "Height (cm)", inputType: "number", rules: { required: true } },
    { type: FieldType.INPUT, name: "weightKg", label: "Weight (kg)", inputType: "number", rules: { required: true } },
    {
      type: FieldType.INPUT,
      name: "bodyFatPercentage",
      label: "Body fat % (enables Katch-McArdle)",
      inputType: "number",
    },
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
      rules: { required: true },
    },
    {
      type: FieldType.SELECT,
      name: "goal",
      label: "Goal",
      options: Object.values(NutritionGoal).map((v) => ({ label: v, value: v })),
      rules: { required: true },
    },
  ];

  const adjustmentFields: FormFieldConfig<ComputeNutritionCalculationInputs>[] = [
    {
      type: FieldType.INPUT,
      name: "goalAdjustmentPercent",
      label: "Goal calorie adjustment (%, e.g. -15)",
      inputType: "number",
    },
    {
      type: FieldType.INPUT,
      name: "goalAdjustmentKcalOverride",
      label: "Or a flat kcal adjustment instead",
      inputType: "number",
    },
    { type: FieldType.INPUT, name: "proteinGPerKgMin", label: "Protein range min (g/kg)", inputType: "number" },
    { type: FieldType.INPUT, name: "proteinGPerKgMax", label: "Protein range max (g/kg)", inputType: "number" },
    {
      type: FieldType.INPUT,
      name: "fatPercentOfCalories",
      label: "Fat (% of calories, default 25)",
      inputType: "number",
    },
    { type: FieldType.SWITCH, name: "acknowledgeBelowSafeFloor", label: "Acknowledge below safe-floor calories" },
  ];

  return (
    <CustomForm<ComputeNutritionCalculationInputs, typeof computeNutritionCalculationEndpoint>
      form={form}
      sections={[
        { title: "Biometrics", fields: biometricFields },
        { title: "Formula & activity", fields: formulaFields },
        { title: "Adjustments (optional overrides)", fields: adjustmentFields },
      ]}
      submitEndpoint={computeNutritionCalculationEndpoint}
      submitButtonText="Calculate"
      onSuccess={onComputed}
      layout="grid"
      columns={2}
    />
  );
}
