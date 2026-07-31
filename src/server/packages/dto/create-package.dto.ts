import { LocalizedStringDto, ToNumber } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, Matches, Min, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus, IconKey, PackageVariant } from "src/common/enums";
import { PricingTiersDto } from "src/server/packages/dto/pricing-tiers.dto";
import { SeoDto } from "src/server/site-settings/dto/seo.dto";

export class CreatePackageDto {
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "key must be lowercase, alphanumeric, and hyphen-separated" })
  key!: string;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name!: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  tag?: LocalizedStringDto;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsEnum(PackageVariant)
  variant!: PackageVariant;

  @IsEnum(IconKey)
  icon!: IconKey;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  followUpLabel!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => PricingTiersDto)
  pricingTiers!: PricingTiersDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalizedStringDto)
  details?: LocalizedStringDto[];

  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  order?: number;

  @IsEnum(ContentStatus)
  status!: ContentStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  seoOverride?: SeoDto;
}
