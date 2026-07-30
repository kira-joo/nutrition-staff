import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsInt, Min, ValidateNested } from "class-validator";
import "reflect-metadata";

/** Shared shape for programHighlights and whyChooseReasons — both are just `{text, order}`. */
export class LabeledOrderedItemDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  text!: LocalizedStringDto;

  @IsInt()
  @Min(0)
  order!: number;
}
