import { LocalizedStringDto, ToNumber } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsMongoId, IsOptional, Min, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

export class CreateFaqItemDto {
  @IsMongoId()
  section!: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  question!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  answer!: LocalizedStringDto;

  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  order?: number;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
