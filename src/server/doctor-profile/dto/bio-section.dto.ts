import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min, ValidateNested } from "class-validator";
import "reflect-metadata";

export class BioSectionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading?: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  body!: LocalizedStringDto;

  @IsInt()
  @Min(0)
  order!: number;
}
