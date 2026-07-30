import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import "reflect-metadata";

export class DurationLabelsDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  month!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  quarter!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  half!: LocalizedStringDto;
}
