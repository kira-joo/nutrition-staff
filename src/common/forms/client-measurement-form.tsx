"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Ruler, Scale, StickyNote } from "lucide-react";
import { BodyCompositionMethod } from "../enums";
import type { createClientMeasurementEndpoint, updateClientMeasurementEndpoint } from "../../../api/client-measurement.endpoints";
import { ClientMeasurement, CreateClientMeasurementDto } from "../interfaces/client-measurement.interface";

export interface ClientMeasurementFormProps {
  clientProfileId: string;
  defaultValues?: ClientMeasurement;
  endpoint: typeof createClientMeasurementEndpoint | typeof updateClientMeasurementEndpoint;
  onSuccess: () => void;
}

export function ClientMeasurementForm({ clientProfileId, defaultValues, endpoint, onSuccess }: ClientMeasurementFormProps) {
  const coreFields: FormFieldConfig<CreateClientMeasurementDto>[] = [
    { type: FieldType.DATE, name: "measuredAt", label: "Measured on", includeTime: true, rules: { required: true } },
    { type: FieldType.INPUT, name: "weightKg", label: "Weight (kg)", inputType: "number" },
  ];

  const circumferenceFields: FormFieldConfig<CreateClientMeasurementDto>[] = [
    { type: FieldType.INPUT, name: "waistCm", label: "Waist (cm)", inputType: "number" },
    { type: FieldType.INPUT, name: "hipCm", label: "Hip (cm)", inputType: "number" },
    { type: FieldType.INPUT, name: "chestCm", label: "Chest (cm)", inputType: "number" },
    { type: FieldType.INPUT, name: "neckCm", label: "Neck (cm)", inputType: "number" },
    { type: FieldType.INPUT, name: "armCm", label: "Arm (cm)", inputType: "number" },
    { type: FieldType.INPUT, name: "thighCm", label: "Thigh (cm)", inputType: "number" },
  ];

  const bodyCompositionFields: FormFieldConfig<CreateClientMeasurementDto>[] = [
    { type: FieldType.INPUT, name: "bodyFatPercentage", label: "Body fat (%)", inputType: "number" },
    { type: FieldType.INPUT, name: "muscleMassKg", label: "Muscle mass (kg)", inputType: "number" },
    { type: FieldType.INPUT, name: "bodyWaterPercentage", label: "Body water (%)", inputType: "number" },
    { type: FieldType.INPUT, name: "visceralFatLevel", label: "Visceral fat level", inputType: "number" },
    {
      type: FieldType.SELECT,
      name: "bodyCompositionMethod",
      label: "Method",
      options: Object.values(BodyCompositionMethod).map((v) => ({ label: v, value: v })),
    },
  ];

  const notesFields: FormFieldConfig<CreateClientMeasurementDto>[] = [
    { type: FieldType.TEXTAREA, name: "notes", label: "Notes" },
  ];

  return (
    <CustomForm<CreateClientMeasurementDto, typeof endpoint>
      sections={[
        { title: "Core", icon: Scale, fields: coreFields },
        { title: "Circumferences", icon: Ruler, fields: circumferenceFields },
        { title: "Body composition", icon: Activity, fields: bodyCompositionFields },
        { title: "Notes", icon: StickyNote, fields: notesFields },
      ]}
      defaultValues={defaultValues ?? { clientProfileId }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      transformValues={(values) => (defaultValues ? values : { ...values, clientProfileId })}
      onSuccess={() => {
        toast.success("Measurement saved");
        onSuccess();
      }}
      layout="grid"
      columns={2}
    />
  );
}
