import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { CampaignBlockType } from "src/common/enums";
import { IsUrlOrPath } from "./is-url-or-path.validator";

export class CtaBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.CTA;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading!: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  buttonLabel!: LocalizedStringDto;

  @IsUrlOrPath()
  buttonUrl!: string;
}
