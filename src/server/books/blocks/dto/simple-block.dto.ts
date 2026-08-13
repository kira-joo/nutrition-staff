import { IsEnum } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** Serves DIVIDER and PAGE_BREAK — both contentless; PAGE_BREAK stays a first-class block (never hidden formatting) per Phase A's hard V1 requirement. */
export class SimpleBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.DIVIDER | BookBlockType.PAGE_BREAK;
}
