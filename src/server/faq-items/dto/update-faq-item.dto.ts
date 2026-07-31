import { LocalizedStringDto, ToNumber } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsMongoId, IsOptional, Min, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

export class UpdateFaqItemDto {
  @IsOptional()
  @IsMongoId()
  section?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  question?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  answer?: LocalizedStringDto;

  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
