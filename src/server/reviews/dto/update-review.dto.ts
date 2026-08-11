import { ImageAssetDto, LocalizedStringDto, ToNumber } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsUrl, Max, Min, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";
import { HasReviewContent } from "./has-review-content.validator";

@HasReviewContent()
export class UpdateReviewDto {
  // Optional here, unlike CreateReviewDto — every field on an update DTO
  // is optional by convention (a partial patch), and a review saved before
  // this field existed must stay editable without being forced to add a
  // rating on every unrelated edit. The staff form still marks this
  // required in its own UI for both create and edit, so in practice a
  // legacy review picks up a real rating the next time someone actually
  // edits it through the app.
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

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

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
