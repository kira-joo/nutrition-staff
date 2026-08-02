import { ToDate } from "@kira-joo/backend-toolkit-core";
import { IsDate, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";

/** Never includes `clientProfileId`/`type`/`createdByUserId` — normal in-place corrections to summary/timing only. Rejected entirely for a system-generated interaction (see updateClientInteraction). */
export class UpdateClientInteractionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  summary?: string;

  @IsOptional()
  @ToDate()
  @IsDate()
  happenedAt?: Date;

  @IsOptional()
  @ToDate()
  @IsDate()
  nextFollowUpAt?: Date;
}
