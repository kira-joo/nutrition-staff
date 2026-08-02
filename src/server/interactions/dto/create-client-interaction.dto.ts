import { ToDate } from "@kira-joo/backend-toolkit-core";
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";
import { InteractionType } from "src/common/enums";

/** `LIFECYCLE_CHANGE` is deliberately not offered as a manually-creatable type here — see the schema's own note. */
export class CreateClientInteractionDto {
  @IsMongoId()
  clientProfileId!: string;

  @IsEnum(InteractionType)
  type!: InteractionType;

  @IsString()
  @MinLength(1)
  summary!: string;

  /** Defaults to now if omitted — editable so a call from yesterday can be logged accurately (backdating). */
  @IsOptional()
  @ToDate()
  @IsDate()
  happenedAt?: Date;

  @IsOptional()
  @ToDate()
  @IsDate()
  nextFollowUpAt?: Date;
}
