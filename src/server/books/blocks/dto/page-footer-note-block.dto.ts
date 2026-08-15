import { IsEnum, IsObject } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/**
 * `richText` is intentionally typed as a bare object here — same reasoning
 * as `ParagraphBlockDto`: the real shape check is the dedicated
 * `assertValidRichTextDoc` walk `validate-book-block.ts` runs afterward,
 * never `@IsObject()` alone.
 */
export class PageFooterNoteBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.PAGE_FOOTER_NOTE;

  @IsObject()
  richText!: object;
}
