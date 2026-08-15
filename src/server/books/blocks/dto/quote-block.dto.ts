import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** Same `richText` caveat as ParagraphBlockDto — `assertValidRichTextDoc` is the real gate. */
export class QuoteBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.QUOTE;

  @IsObject()
  richText!: object;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  attribution?: string;
}
