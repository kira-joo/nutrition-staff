"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Apple, Cigarette, HeartPulse, Moon, Pill, StickyNote } from "lucide-react";
import { ActivityLevel, AlcoholUse, Gender, NutritionGoal, SleepQuality, SmokingStatus } from "../enums";
import type {
  createNutritionAssessmentEndpoint,
  updateNutritionAssessmentEndpoint,
} from "../../../api/nutrition-assessment.endpoints";
import { CreateNutritionAssessmentDto, NutritionAssessment } from "../interfaces/nutrition-assessment.interface";

/** The 7 string-list fields are edited as comma-separated text and split/joined on load/submit — matches the same convention already used for ClientProfile.tags. */
type FormValues = Omit<
  CreateNutritionAssessmentDto,
  "medicalConditions" | "medications" | "supplements" | "allergies" | "foodIntolerances" | "preferredFoods" | "dislikedFoods"
> & {
  medicalConditionsInput?: string;
  medicationsInput?: string;
  supplementsInput?: string;
  allergiesInput?: string;
  foodIntolerancesInput?: string;
  preferredFoodsInput?: string;
  dislikedFoodsInput?: string;
};

function toCommaList(values?: string[]): string | undefined {
  return values && values.length > 0 ? values.join(", ") : undefined;
}

function fromCommaList(input?: string): string[] {
  return input
    ? input
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
}

export interface NutritionAssessmentFormProps {
  clientProfileId: string;
  clientGender?: Gender;
  defaultValues?: NutritionAssessment;
  endpoint: typeof createNutritionAssessmentEndpoint | typeof updateNutritionAssessmentEndpoint;
  onSuccess: (assessment: NutritionAssessment) => void;
}

export function NutritionAssessmentForm({
  clientProfileId,
  clientGender,
  defaultValues,
  endpoint,
  onSuccess,
}: NutritionAssessmentFormProps) {
  const showReproductiveHealth = clientGender !== Gender.MALE;

  const goalActivityFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.DATE, name: "assessedAt", label: "Assessed on", rules: { required: true } },
    {
      type: FieldType.SELECT,
      name: "goal",
      label: "Goal",
      options: Object.values(NutritionGoal).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.SELECT,
      name: "activityLevel",
      label: "Activity level",
      options: Object.values(ActivityLevel).map((v) => ({ label: v, value: v })),
    },
  ];

  const lifestyleFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.INPUT, name: "occupation", label: "Occupation" },
    { type: FieldType.INPUT, name: "workSchedule", label: "Work schedule (e.g. day/night shift)" },
    { type: FieldType.INPUT, name: "sleepHours", label: "Sleep hours/night", inputType: "number" },
    {
      type: FieldType.SELECT,
      name: "sleepQuality",
      label: "Sleep quality",
      options: Object.values(SleepQuality).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.SELECT,
      name: "smokingStatus",
      label: "Smoking",
      options: Object.values(SmokingStatus).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.SELECT,
      name: "alcoholUse",
      label: "Alcohol use",
      options: Object.values(AlcoholUse).map((v) => ({ label: v, value: v })),
    },
  ];

  const dietFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.INPUT, name: "waterIntakeLiters", label: "Water intake (L/day)", inputType: "number" },
    { type: FieldType.INPUT, name: "mealsPerDay", label: "Meals per day", inputType: "number" },
    { type: FieldType.INPUT, name: "dietaryPattern", label: "Dietary pattern (e.g. vegetarian, halal)" },
    { type: FieldType.INPUT, name: "preferredFoodsInput", label: "Preferred foods (comma-separated)" },
    { type: FieldType.INPUT, name: "dislikedFoodsInput", label: "Disliked foods (comma-separated)" },
  ];

  const medicalFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.INPUT, name: "medicalConditionsInput", label: "Medical conditions (comma-separated)" },
    { type: FieldType.INPUT, name: "medicationsInput", label: "Medications (comma-separated)" },
    { type: FieldType.INPUT, name: "supplementsInput", label: "Supplements (comma-separated)" },
    { type: FieldType.INPUT, name: "allergiesInput", label: "Allergies (comma-separated)" },
    { type: FieldType.INPUT, name: "foodIntolerancesInput", label: "Food intolerances (comma-separated)" },
  ];

  const reproductiveHealthFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.INPUT, name: "pregnancyStatus", label: "Pregnancy status" },
    { type: FieldType.INPUT, name: "breastfeedingStatus", label: "Breastfeeding status" },
  ];

  const notesFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.TEXTAREA, name: "digestiveNotes", label: "Digestive notes" },
    { type: FieldType.TEXTAREA, name: "appetiteNotes", label: "Appetite notes" },
    { type: FieldType.TEXTAREA, name: "lifestyleNotes", label: "General lifestyle / daily routine" },
    { type: FieldType.TEXTAREA, name: "generalNotes", label: "General notes" },
  ];

  return (
    <CustomForm<FormValues, typeof endpoint>
      sections={[
        { title: "Goal & activity", icon: Activity, fields: goalActivityFields },
        { title: "Lifestyle & sleep", icon: Moon, fields: lifestyleFields },
        { title: "Diet & hydration", icon: Apple, fields: dietFields },
        { title: "Medical & allergies", icon: Pill, fields: medicalFields },
        ...(showReproductiveHealth
          ? [{ title: "Reproductive health", icon: HeartPulse, fields: reproductiveHealthFields }]
          : []),
        { title: "Notes", icon: StickyNote, fields: notesFields },
      ]}
      defaultValues={
        defaultValues
          ? {
              ...defaultValues,
              medicalConditionsInput: toCommaList(defaultValues.medicalConditions),
              medicationsInput: toCommaList(defaultValues.medications),
              supplementsInput: toCommaList(defaultValues.supplements),
              allergiesInput: toCommaList(defaultValues.allergies),
              foodIntolerancesInput: toCommaList(defaultValues.foodIntolerances),
              preferredFoodsInput: toCommaList(defaultValues.preferredFoods),
              dislikedFoodsInput: toCommaList(defaultValues.dislikedFoods),
            }
          : { clientProfileId }
      }
      transformValues={({
        medicalConditionsInput,
        medicationsInput,
        supplementsInput,
        allergiesInput,
        foodIntolerancesInput,
        preferredFoodsInput,
        dislikedFoodsInput,
        ...values
      }) => ({
        ...values,
        ...(defaultValues ? {} : { clientProfileId }),
        medicalConditions: fromCommaList(medicalConditionsInput),
        medications: fromCommaList(medicationsInput),
        supplements: fromCommaList(supplementsInput),
        allergies: fromCommaList(allergiesInput),
        foodIntolerances: fromCommaList(foodIntolerancesInput),
        preferredFoods: fromCommaList(preferredFoodsInput),
        dislikedFoods: fromCommaList(dislikedFoodsInput),
      })}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      onSuccess={(assessment) => {
        toast.success("Assessment saved");
        onSuccess(assessment);
      }}
      layout="grid"
      columns={2}
    />
  );
}
