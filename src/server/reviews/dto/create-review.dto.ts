import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsUrl, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";
import { HasReviewContent } from "./has-review-content.validator";

@HasReviewContent()
export class CreateReviewDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  content?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  authorName?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  authorLabel?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  beforeImage?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  afterImage?: ImageAssetDto | null;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
