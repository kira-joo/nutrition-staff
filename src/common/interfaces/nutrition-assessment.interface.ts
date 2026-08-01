import { ActivityLevel, AlcoholUse, NutritionGoal, SleepQuality, SmokingStatus } from "../enums";
import type { ClientUserSummary } from "./client.interface";

export interface NutritionAssessment {
  _id: string;
  clientProfileId: string;
  assessedAt: string;
  assessedByUserId: ClientUserSummary;
  previousAssessmentId?: string;
  goal?: NutritionGoal;
  activityLevel?: ActivityLevel;
  occupation?: string;
  workSchedule?: string;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  smokingStatus?: SmokingStatus;
  alcoholUse?: AlcoholUse;
  waterIntakeLiters?: number;
  mealsPerDay?: number;
  medicalConditions: string[];
  medications: string[];
  supplements: string[];
  allergies: string[];
  foodIntolerances: string[];
  preferredFoods: string[];
  dislikedFoods: string[];
  dietaryPattern?: string;
  pregnancyStatus?: string;
  breastfeedingStatus?: string;
  digestiveNotes?: string;
  appetiteNotes?: string;
  lifestyleNotes?: string;
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNutritionAssessmentDto {
  clientProfileId: string;
  assessedAt: string;
  previousAssessmentId?: string;
  goal?: NutritionGoal;
  activityLevel?: ActivityLevel;
  occupation?: string;
  workSchedule?: string;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  smokingStatus?: SmokingStatus;
  alcoholUse?: AlcoholUse;
  waterIntakeLiters?: number;
  mealsPerDay?: number;
  medicalConditions?: string[];
  medications?: string[];
  supplements?: string[];
  allergies?: string[];
  foodIntolerances?: string[];
  preferredFoods?: string[];
  dislikedFoods?: string[];
  dietaryPattern?: string;
  pregnancyStatus?: string;
  breastfeedingStatus?: string;
  digestiveNotes?: string;
  appetiteNotes?: string;
  lifestyleNotes?: string;
  generalNotes?: string;
}

export type UpdateNutritionAssessmentDto = Partial<Omit<CreateNutritionAssessmentDto, "clientProfileId">>;
