import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";
import { Currency } from "src/common/enums";
import { SeoDto } from "src/server/site-settings/dto/seo.dto";
import { SocialLinkDto } from "src/server/site-settings/dto/social-link.dto";

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @OptionalOrCleared()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Currency)
  currencyCode?: Currency;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  logo?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  favicon?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDto)
  defaultSeo?: SeoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  ogImage?: ImageAssetDto | null;

  @IsOptional()
  @IsString()
  activeCampaignId?: string;
}
