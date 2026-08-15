import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import "reflect-metadata";
import { BookContactBlockDto } from "src/server/book-settings/dto/book-contact-block.dto";
import { BookPrintSettingsDto } from "src/server/book-settings/dto/book-print-settings.dto";
import { BookSocialLinkDto } from "src/server/book-settings/dto/book-social-link.dto";

/** Mirrors BookSettings' overridable shape exactly — every field optional; `Book.overriddenFields` (not this DTO) is what decides which ones are actually active. */
export class BookOverridesDto {
  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  doctorTitle?: string;

  @IsOptional()
  @IsString()
  doctorBio?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  doctorImage?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  bookLogo?: ImageAssetDto | null;

  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookSocialLinkDto)
  socialLinks?: BookSocialLinkDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BookContactBlockDto)
  contact?: BookContactBlockDto;

  @IsOptional()
  @IsString()
  disclaimer?: string;

  @IsOptional()
  @IsString()
  copyrightText?: string;

  @IsOptional()
  @IsString()
  backCoverClosingText?: string;

  @IsOptional()
  @IsString()
  backCoverAudienceText?: string;

  @IsOptional()
  @IsString()
  qrDestination?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookPrintSettingsDto)
  print?: BookPrintSettingsDto;
}
