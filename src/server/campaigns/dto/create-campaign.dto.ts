import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, Matches, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

// Blocks are never part of this DTO — a Campaign is created with zero
// blocks; they're added afterward via their own sub-resource routes.
export class CreateCampaignDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "slug must be lowercase, alphanumeric, and hyphen-separated" })
  slug!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
