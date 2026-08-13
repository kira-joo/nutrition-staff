import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsString, MaxLength, ValidateNested } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

export class ChecklistItemDto {
  // Client-generated crypto.randomUUID() — declared so it isn't stripped, never trusted for identity beyond display.
  @IsString()
  id!: string;

  @IsString()
  @MaxLength(300)
  text!: string;

  @IsBoolean()
  checked!: boolean;
}

export class ChecklistBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.CHECKLIST;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items!: ChecklistItemDto[];
}
