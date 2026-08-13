import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import "reflect-metadata";

export class CreateChapterDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  intro?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  coverImage?: ImageAssetDto | null;

  @IsOptional()
  @IsBoolean()
  startOnNewPage?: boolean;

  @IsOptional()
  @IsBoolean()
  includeInToc?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tocTitle?: string;

  @IsInt()
  expectedRevision!: number;
}
