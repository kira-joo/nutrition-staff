import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { CampaignBlockType } from "src/common/enums";

/**
 * `id`/`order` are deliberately not part of this DTO — same reasoning as
 * `HeroBlockDto`: server-generated on add, route-param-supplied on replace,
 * never client-controlled.
 */
export class RichTextBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.RICH_TEXT;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading?: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  body!: LocalizedStringDto;
}
