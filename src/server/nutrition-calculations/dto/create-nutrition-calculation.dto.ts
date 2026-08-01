import { ToBoolean, ToDate } from "@kira-joo/backend-toolkit-core";
import { IsBoolean, IsDate, IsMongoId, IsObject, IsOptional, IsString } from "class-validator";
import "reflect-metadata";

/**
 * Persists an already-computed snapshot verbatim — `inputs`/`results`/
 * `assumptions`/`engineVersion`/`calculatedAt` must be exactly what
 * `POST /api/nutrition-calculations/compute` returned; this route never
 * recomputes them. Exactly one of `clientProfileId` (client-based flow,
 * already known) or `targetUserId` (standalone "Assign to Client" flow,
 * resolved/optionally-created server-side) must be given.
 */
export class CreateNutritionCalculationDto {
  @IsOptional()
  @IsMongoId()
  clientProfileId?: string;

  @IsOptional()
  @IsMongoId()
  targetUserId?: string;

  /** Only meaningful alongside `targetUserId` — explicit confirmation that a `ClientProfile` should be created for this User if they don't have one yet. */
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  createClientProfileIfMissing?: boolean;

  @IsOptional()
  @IsMongoId()
  assessmentId?: string;

  @IsOptional()
  @IsMongoId()
  measurementId?: string;

  @IsString()
  engineVersion!: string;

  @IsObject()
  inputs!: Record<string, unknown>;

  @IsObject()
  results!: Record<string, unknown>;

  @IsOptional()
  @IsString({ each: true })
  assumptions?: string[];

  @ToDate()
  @IsDate()
  calculatedAt!: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
