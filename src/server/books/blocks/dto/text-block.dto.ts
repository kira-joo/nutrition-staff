import { IsEnum, IsString, MaxLength } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** Plain Arabic string, deliberately not rich text — a heading/subheading is structural, not a place for inline marks (see BOOK_PLAN clarification 2). */
export class HeadingBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.HEADING;

  @IsString()
  @MaxLength(200)
  text!: string;
}

export class SubheadingBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.SUBHEADING;

  @IsString()
  @MaxLength(200)
  text!: string;
}
