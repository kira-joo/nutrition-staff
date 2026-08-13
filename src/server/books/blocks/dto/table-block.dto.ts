import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { MAX_TABLE_CELLS } from "src/common/books/book-limits";
import { BaseBookBlockDto } from "./base-book-block.dto";

@ValidatorConstraint({ name: "withinTableCellBudget", async: false })
class WithinTableCellBudgetConstraint implements ValidatorConstraintInterface {
  validate(rows: unknown, args: ValidationArguments): boolean {
    const headers = ((args.object as Record<string, unknown>).headers as unknown[]) ?? [];
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    return headers.length * (rowCount + 1) <= MAX_TABLE_CELLS;
  }
  defaultMessage(): string {
    return `This table exceeds the ${MAX_TABLE_CELLS}-cell budget (headers × (rows + 1)). Use fewer columns or rows.`;
  }
}

export class TableBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.TABLE;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  headers!: string[];

  @IsArray()
  @ArrayMaxSize(200)
  @Validate(WithinTableCellBudgetConstraint)
  rows!: string[][];
}
