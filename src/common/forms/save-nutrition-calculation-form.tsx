"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { createNutritionCalculationEndpoint } from "../../../api/nutrition-calculation.endpoints";
import { ComputeNutritionCalculationResponse, CreateNutritionCalculationDto, NutritionCalculation } from "../interfaces/nutrition-calculation.interface";

interface SaveFormValues {
  notes?: string;
}

export interface SaveNutritionCalculationFormProps {
  clientProfileId: string;
  assessmentId?: string;
  measurementId?: string;
  computed: ComputeNutritionCalculationResponse;
  onSuccess: (calculation: NutritionCalculation) => void;
}

/** Client-based flow's save action — persists the already-computed snapshot exactly as held in `computed`, against a clientProfileId already known (no picker needed, unlike the standalone Assign flow). */
export function SaveNutritionCalculationForm({
  clientProfileId,
  assessmentId,
  measurementId,
  computed,
  onSuccess,
}: SaveNutritionCalculationFormProps) {
  const fields: FormFieldConfig<SaveFormValues>[] = [
    { type: FieldType.TEXTAREA, name: "notes", label: "Notes (optional)" },
  ];

  return (
    <CustomForm<SaveFormValues, typeof createNutritionCalculationEndpoint>
      sections={[{ fields }]}
      submitEndpoint={createNutritionCalculationEndpoint}
      submitButtonText="Save to this client"
      transformValues={(values): CreateNutritionCalculationDto => ({
        clientProfileId,
        assessmentId,
        measurementId,
        notes: values.notes,
        engineVersion: computed.engineVersion,
        inputs: computed.inputs as unknown as Record<string, unknown>,
        results: computed.results as unknown as Record<string, unknown>,
        assumptions: computed.assumptions,
        calculatedAt: computed.calculatedAt,
      })}
      onSuccess={(calculation) => {
        toast.success("Calculation saved");
        onSuccess(calculation);
      }}
    />
  );
}
