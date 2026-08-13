import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** Image and Image-with-caption collapse into one type — an empty/omitted caption just renders no caption (see BOOK_PLAN notes on this deliberate narrowing). */
export class ImageBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.IMAGE;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}
