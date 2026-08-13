import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsString, MaxLength } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

const MAX_LIST_ITEMS = 100;

/** Serves both BULLET_LIST and NUMBERED_LIST — identical shape, only the rendered marker differs (a renderer concern, not a data concern). */
export class ListBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.BULLET_LIST | BookBlockType.NUMBERED_LIST;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LIST_ITEMS)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  items!: string[];
}
