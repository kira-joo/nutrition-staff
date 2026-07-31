import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsISO8601, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { CampaignBlockType } from "src/common/enums";

export class CountdownBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.COUNTDOWN;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading!: LocalizedStringDto;

  @IsISO8601()
  targetDate!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  expiredLabel?: LocalizedStringDto;
}
