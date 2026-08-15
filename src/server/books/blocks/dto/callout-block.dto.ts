import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** Serves TIP, NOTE, and WARNING — identical shape, only the rendered icon/color differs (a renderer/template concern, per the "no colour control in rich text" rule this stays outside Tiptap entirely). */
export class CalloutBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.TIP | BookBlockType.NOTE | BookBlockType.WARNING;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsObject()
  richText!: object;
}
