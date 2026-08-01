import { ToDate, ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import "reflect-metadata";
import { ActivityLevel, AlcoholUse, NutritionGoal, SleepQuality, SmokingStatus } from "src/common/enums";

/** Never includes `clientProfileId` — an assessment is never reassigned to a different client after the fact. */
export class UpdateNutritionAssessmentDto {
  @IsOptional()
  @ToDate()
  @IsDate()
  assessedAt?: Date;

  @IsOptional()
  @IsMongoId()
  previousAssessmentId?: string;

  @IsOptional()
  @IsEnum(NutritionGoal)
  goal?: NutritionGoal;

  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  workSchedule?: string;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @IsOptional()
  @IsEnum(SleepQuality)
  sleepQuality?: SleepQuality;

  @IsOptional()
  @IsEnum(SmokingStatus)
  smokingStatus?: SmokingStatus;

  @IsOptional()
  @IsEnum(AlcoholUse)
  alcoholUse?: AlcoholUse;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  @Max(15)
  waterIntakeLiters?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(1)
  @Max(10)
  mealsPerDay?: number;

  @IsOptional()
  @IsString({ each: true })
  medicalConditions?: string[];

  @IsOptional()
  @IsString({ each: true })
  medications?: string[];

  @IsOptional()
  @IsString({ each: true })
  supplements?: string[];

  @IsOptional()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsString({ each: true })
  foodIntolerances?: string[];

  @IsOptional()
  @IsString({ each: true })
  preferredFoods?: string[];

  @IsOptional()
  @IsString({ each: true })
  dislikedFoods?: string[];

  @IsOptional()
  @IsString()
  dietaryPattern?: string;

  @IsOptional()
  @IsString()
  pregnancyStatus?: string;

  @IsOptional()
  @IsString()
  breastfeedingStatus?: string;

  @IsOptional()
  @IsString()
  digestiveNotes?: string;

  @IsOptional()
  @IsString()
  appetiteNotes?: string;

  @IsOptional()
  @IsString()
  lifestyleNotes?: string;

  @IsOptional()
  @IsString()
  generalNotes?: string;
}
