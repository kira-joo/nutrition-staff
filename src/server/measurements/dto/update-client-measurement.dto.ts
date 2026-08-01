import { ToDate, ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import "reflect-metadata";
import { BodyCompositionMethod } from "src/common/enums";

/** Never includes `clientProfileId`/`recordedByUserId` — a measurement is never reassigned to a different client or a different recorder after the fact. */
export class UpdateClientMeasurementDto {
  @IsOptional()
  @ToDate()
  @IsDate()
  measuredAt?: Date;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(2)
  @Max(400)
  weightKg?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(20)
  @Max(300)
  waistCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(20)
  @Max(300)
  hipCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(20)
  @Max(300)
  chestCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(10)
  @Max(100)
  neckCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(10)
  @Max(100)
  armCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(10)
  @Max(150)
  thighCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(1)
  @Max(70)
  bodyFatPercentage?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(5)
  @Max(150)
  muscleMassKg?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(20)
  @Max(80)
  bodyWaterPercentage?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(1)
  @Max(60)
  visceralFatLevel?: number;

  @IsOptional()
  @IsEnum(BodyCompositionMethod)
  bodyCompositionMethod?: BodyCompositionMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
