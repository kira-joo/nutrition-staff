import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { BioSectionDto } from "src/server/doctor-profile/dto/bio-section.dto";
import { LabeledOrderedItemDto } from "src/server/doctor-profile/dto/labeled-ordered-item.dto";

// Note: no `gallery` field here — gallery items are managed via their own
// sub-resource routes (src/app/api/doctor-profile/gallery/**), each with
// its own single-asset multipart request, not bundled into this update.
export class UpdateDoctorProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  tagline?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  avatar?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  avatarAlt?: LocalizedStringDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BioSectionDto)
  bioSections?: BioSectionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  programHeading?: LocalizedStringDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabeledOrderedItemDto)
  programHighlights?: LabeledOrderedItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  whyChooseHeading?: LocalizedStringDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabeledOrderedItemDto)
  whyChooseReasons?: LabeledOrderedItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  featuredInLabel?: LocalizedStringDto;
}
