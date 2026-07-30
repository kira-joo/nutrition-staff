import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import "reflect-metadata";

export class SeoDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description!: LocalizedStringDto;
}
