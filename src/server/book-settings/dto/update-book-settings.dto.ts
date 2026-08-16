import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";
import { BookContactBlockDto } from "src/server/book-settings/dto/book-contact-block.dto";
import { BookPageWatermarkDto } from "src/server/book-settings/dto/book-page-watermark.dto";
import { BookPrintSettingsDto } from "src/server/book-settings/dto/book-print-settings.dto";
import { BookSocialLinkDto } from "src/server/book-settings/dto/book-social-link.dto";

export class UpdateBookSettingsDto {
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

  // OptionalOrCleared, not IsOptional: class-validator's IsOptional skips
  // only undefined/null, so an explicit "" reached @IsUrl() and made the
  // whole settings form unsavable whenever the website URL was blank.
  @OptionalOrCleared()
  @IsUrl()
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
  defaultQrDestination?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookPrintSettingsDto)
  print?: BookPrintSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookPageWatermarkDto)
  pageWatermark?: BookPageWatermarkDto;
}
