import { ToBoolean, ToDate, ToNumber } from "@kira-joo/backend-toolkit-core";
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import "reflect-metadata";
import { ClientLifecycle, ClientSource, Gender } from "src/common/enums";

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
