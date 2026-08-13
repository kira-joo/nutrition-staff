import { IsEnum, IsString } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** `referenceId` must exist in `book.references` — checked in `assert-book-block-references-valid.ts` (needs the live book, not just this DTO). */
export class CitationBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.CITATION;

  @IsString()
  referenceId!: string;
}
