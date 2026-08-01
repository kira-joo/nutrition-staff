import { ActivityLevel, BmrFormula, CalculationType, Gender, NutritionGoal } from "../enums";
import type { ClientUserSummary } from "./client.interface";

export interface ComputeNutritionCalculationInputs {
  gender?: Gender;
  bmrGenderOverride?: Gender;
  dateOfBirth?: string;
  birthYear?: number;
  heightCm: number;
  weightKg: number;
  bodyFatPercentage?: number;
  bmrFormula?: BmrFormula;
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
  goalAdjustmentPercent?: number;
  goalAdjustmentKcalOverride?: number;
  proteinGPerKgMin?: number;
  proteinGPerKgMax?: number;
  fatPercentOfCalories?: number;
  acknowledgeBelowSafeFloor?: boolean;
}

export interface ValueUnit {
  value: number;
  unit: string;
  [key: string]: unknown;
}

export interface RangeUnit {
  min: number;
  max: number;
  unit: string;
  [key: string]: unknown;
}

/** Every entry carries its own value/unit/formula inline — a single top-level formula name can't describe a multi-output run. */
export interface NutritionCalculationResults {
  bmi?: ValueUnit & { category: string };
  bmr?: ValueUnit;
  maintenanceCalories?: ValueUnit & { activityMultiplier: number };
  goalCalories?: ValueUnit & { delta: number; method: string; belowSafeFloor: boolean; safetyFloorKcal: number };
  calorieDelta?: ValueUnit;
  proteinRangeGrams?: RangeUnit & { gPerKgRange: [number, number] };
  macros?: { proteinGrams: number; carbGrams: number; fatGrams: number; unit: string; fatPercentOfCalories: number };
  targetWeightRangeKg?: RangeUnit;
  waterIntakeLiters?: ValueUnit & { activityAdjustmentLiters: number };
}

export interface ComputeNutritionCalculationResponse {
  inputs: ComputeNutritionCalculationInputs;
  engineVersion: string;
  calculatedAt: string;
  results: NutritionCalculationResults;
  assumptions: string[];
}

export interface NutritionCalculation {
  _id: string;
  clientProfileId: string;
  assessmentId?: string;
  measurementId?: string;
  type: CalculationType;
  engineVersion: string;
  inputs: ComputeNutritionCalculationInputs;
  results: NutritionCalculationResults;
  assumptions: string[];
  calculatedAt: string;
  calculatedByUserId: ClientUserSummary;
  assignedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNutritionCalculationDto {
  clientProfileId?: string;
  targetUserId?: string;
  createClientProfileIfMissing?: boolean;
  assessmentId?: string;
  measurementId?: string;
  engineVersion: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  assumptions: string[];
  calculatedAt: string;
  notes?: string;
}

export interface UpdateNutritionCalculationDto {
  notes: string;
}
