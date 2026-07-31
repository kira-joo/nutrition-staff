import { ImageAssetDto, LocalizedStringDto, VideoAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { CampaignBlockType } from "src/common/enums";
import { HasMediaSource } from "./has-media-source.validator";

@HasMediaSource()
export class MediaBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.MEDIA;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => VideoAssetDto)
  video?: VideoAssetDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  caption?: LocalizedStringDto;
}
