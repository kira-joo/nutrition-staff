import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import "reflect-metadata";
import { BookOverrideKey, BookStatus, BookVisibility } from "src/common/enums";
import { BookOverridesDto } from "src/server/books/dto/book-overrides.dto";

/**
 * Header-only update — never chapters/frontMatter/backMatter/references
 * (those go through their own Phase C sub-resource routes once they
 * exist). `status` deliberately excludes a path to `PUBLISHED`; the
 * handler enforces that via `assertBookStatusTransition`, not this DTO,
 * since the same enum is legitimately used elsewhere.
 */
export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "slug must be lowercase letters, numbers, and hyphens only" })
  slug?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  editionLabelTemplate?: string;

  // "generated" vs "uploaded" — see BookCoverMode's doc comment. Not
  // required: a header PATCH that only changes e.g. `title` doesn't need
  // to restate the cover mode every time.
  @IsOptional()
  @IsIn(["generated", "uploaded"])
  coverMode?: "generated" | "uploaded";

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  coverImage?: ImageAssetDto | null;

  @IsOptional()
  @IsIn(["generated", "uploaded"])
  backCoverMode?: "generated" | "uploaded";

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  backCoverImage?: ImageAssetDto | null;

  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsEnum(BookVisibility)
  visibility?: BookVisibility;

  @IsOptional()
  @IsBoolean()
  allowFlipbook?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPdfDownload?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnWebsite?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookOverridesDto)
  overrides?: BookOverridesDto;

  @IsOptional()
  @IsArray()
  @IsEnum(BookOverrideKey, { each: true })
  overriddenFields?: BookOverrideKey[];

  @IsInt()
  expectedRevision!: number;
}
