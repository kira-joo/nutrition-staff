import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

export class UpdateFaqSectionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title?: LocalizedStringDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
