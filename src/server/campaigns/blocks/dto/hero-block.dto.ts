import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsUrl, ValidateNested } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";
import { CampaignBlockType } from "src/common/enums";

/**
 * `id` is deliberately not part of this DTO — it's server-generated on add
 * (never client-supplied) and comes from the route param on replace, same
 * as DoctorProfile's gallery items. `order` is likewise never part of a
 * block's own DTO: add always appends, and replace never changes position
 * (reordering is its own dedicated route).
 */
export class HeroBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.HERO;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading!: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  subheading?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  ctaLabel?: LocalizedStringDto;

  @OptionalOrCleared()
  @IsUrl()
  ctaUrl?: string;
}
