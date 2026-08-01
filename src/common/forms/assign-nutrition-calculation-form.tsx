"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import { createNutritionCalculationEndpoint } from "../../../api/nutrition-calculation.endpoints";
import { ComputeNutritionCalculationResponse, CreateNutritionCalculationDto, NutritionCalculation } from "../interfaces/nutrition-calculation.interface";

interface AssignFormValues {
  targetUserId: string;
  createClientProfileIfMissing?: boolean;
  notes?: string;
}

export interface AssignNutritionCalculationFormProps {
  computed: ComputeNutritionCalculationResponse;
  onSuccess: (calculation: NutritionCalculation) => void;
}

/**
 * "Assign to Client" — persists the *already-computed* snapshot exactly as
 * held in `computed`, never recalculating. If the picked User has no
 * ClientProfile yet, the doctor must explicitly check "create client
 * profile" (the server rejects with a clear message otherwise rather than
 * silently creating one).
 */
export function AssignNutritionCalculationForm({ computed, onSuccess }: AssignNutritionCalculationFormProps) {
  const fields: FormFieldConfig<AssignFormValues>[] = [
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "targetUserId",
      label: "Assign to",
      endpoint: getUsersEndpoint,
      optionLabel: "name",
      optionValue: "_id",
      placeholder: "Search for a person",
      rules: { required: true },
    },
    {
      type: FieldType.SWITCH,
      name: "createClientProfileIfMissing",
      label: "This person has no client profile yet — create one now",
    },
    { type: FieldType.TEXTAREA, name: "notes", label: "Notes (optional)" },
  ];

  return (
    <CustomForm<AssignFormValues, typeof createNutritionCalculationEndpoint>
      sections={[{ fields }]}
      submitEndpoint={createNutritionCalculationEndpoint}
      submitButtonText="Assign to Client"
      transformValues={(values): CreateNutritionCalculationDto => ({
        targetUserId: values.targetUserId,
        createClientProfileIfMissing: values.createClientProfileIfMissing,
        notes: values.notes,
        engineVersion: computed.engineVersion,
        inputs: computed.inputs as unknown as Record<string, unknown>,
        results: computed.results as unknown as Record<string, unknown>,
        assumptions: computed.assumptions,
        calculatedAt: computed.calculatedAt,
      })}
      onSuccess={(calculation) => {
        toast.success("Calculation assigned to client");
        onSuccess(calculation);
      }}
    />
  );
}
