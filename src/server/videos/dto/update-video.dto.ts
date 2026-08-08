import { ImageAssetDto, LocalizedStringDto, VideoAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsUrl, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";
import { HasVideoSource } from "src/server/videos/dto/has-video-source.validator";

@HasVideoSource()
export class UpdateVideoDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VideoAssetDto)
  video?: VideoAssetDto | null;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  poster?: ImageAssetDto | null;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
