import { ToBoolean, ToDate, ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, Max, Min } from "class-validator";
import "reflect-metadata";
import { ActivityLevel, BmrFormula, Gender, NutritionGoal } from "src/common/enums";

/**
 * The exact input set the workspace collects — becomes the persisted
 * calculation's `inputs` verbatim once saved. Range validation rejects
 * out-of-range values outright rather than silently clamping them.
 */
export class ComputeNutritionCalculationDto {
  /** Optional — absent means not specified, which is exactly when `bmrGenderOverride` matters. */
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(Gender)
  bmrGenderOverride?: Gender;

  @IsOptional()
  @ToDate()
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  birthYear?: number;

  @ToNumber()
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm!: number;

  @ToNumber()
  @IsNumber()
  @Min(2)
  @Max(400)
  weightKg!: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(1)
  @Max(70)
  bodyFatPercentage?: number;

  @IsOptional()
  @IsEnum(BmrFormula)
  bmrFormula?: BmrFormula;

  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @IsOptional()
  @IsEnum(NutritionGoal)
  goal?: NutritionGoal;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(-50)
  @Max(50)
  goalAdjustmentPercent?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  goalAdjustmentKcalOverride?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0.5)
  @Max(4)
  proteinGPerKgMin?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0.5)
  @Max(4)
  proteinGPerKgMax?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(10)
  @Max(60)
  fatPercentOfCalories?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  acknowledgeBelowSafeFloor?: boolean;
}
