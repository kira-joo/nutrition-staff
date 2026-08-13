import { IsEnum, IsObject } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/**
 * `richText` is intentionally typed as a bare object here — class-validator
 * decorators can check "is an object" but not "is this exact ProseMirror
 * allow-list", so the real validation is a dedicated walk
 * (`assertValidRichTextDoc`), run explicitly by `validate-book-block.ts`
 * after this DTO passes. Never trust this field's shape from `@IsObject()`
 * alone.
 */
export class ParagraphBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.PARAGRAPH;

  @IsObject()
  richText!: object;
}
