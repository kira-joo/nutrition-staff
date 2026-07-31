import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import "reflect-metadata";
import { CampaignBlockType } from "src/common/enums";

/**
 * Unlike the block's own `id` (always server-generated), an item's `id` is
 * client-generated (crypto.randomUUID(), for stable React keys/tracking
 * while editing) and just trusted as-is — declared here, and optional,
 * purely so class-validator's default whitelist doesn't reject the whole
 * request over an undeclared property. It carries no security meaning
 * (unlike the block's own id, it's never used as a route param).
 */
export class FeatureGridItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading!: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;
}

export class FeatureGridBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.FEATURE_GRID;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading?: LocalizedStringDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FeatureGridItemDto)
  items!: FeatureGridItemDto[];
}
