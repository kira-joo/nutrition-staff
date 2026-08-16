import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";
import { ClientSource } from "src/common/enums";

/**
 * Minimum viable capture for a new lead/client: name + phone. Everything
 * else (DOB, gender, height, marketing consent, notes, follow-up date) is
 * edited afterward via the Client Profile tab — this stays deliberately
 * thin so reception can log a lead in seconds.
 */
export class CreateClientDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @OptionalOrCleared()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @IsOptional()
  @IsString()
  sourceNote?: string;

  @IsOptional()
  @IsMongoId()
  assignedToUserId?: string;
}
