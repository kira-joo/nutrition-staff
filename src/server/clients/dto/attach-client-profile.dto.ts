import { ToBoolean, ToDate, ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsBoolean, IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";
import "reflect-metadata";
import { ClientLifecycle, ClientSource, Gender } from "src/common/enums";

/**
 * Every `ClientProfile`-specific field from `UpdateClientDto`, minus
 * `name`/`phone`/`email` — those live on the existing `User` this profile
 * is being attached to and are never re-asked for. `lifecycle` stays
 * optional here (unlike a full update): omitted, it defaults to `LEAD` in
 * `attachClientProfile`, matching the "Add Client" create flow's own
 * default for a brand-new identity.
 */
export class AttachClientProfileDto {
  @IsOptional()
  @IsEnum(ClientLifecycle)
  lifecycle?: ClientLifecycle;

  @IsOptional()
  @ToDate()
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  birthYear?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  targetWeightKg?: number;

  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @IsOptional()
  @IsString()
  sourceNote?: string;

  @IsOptional()
  @IsMongoId()
  assignedToUserId?: string;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @ToDate()
  @IsDate()
  nextFollowUpAt?: Date;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  generalNotes?: string;
}
