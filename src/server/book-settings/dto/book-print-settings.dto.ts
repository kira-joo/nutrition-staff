import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from "class-validator";
import "reflect-metadata";
import { BookMarginPreset, BookPageSize } from "src/common/enums";

export class BookPrintSettingsDto {
  @IsOptional()
  @IsEnum(BookPageSize)
  pageSize?: BookPageSize;

  @IsOptional()
  @IsEnum(BookMarginPreset)
  marginPreset?: BookMarginPreset;

  @IsOptional()
  @IsInt()
  @Min(0)
  gutterMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageNumberStart?: number;

  @IsOptional()
  @IsBoolean()
  doublePageSpread?: boolean;
}
