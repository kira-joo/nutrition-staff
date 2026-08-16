import { ImageAssetDto, LocalizedStringDto, VideoAssetDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsUrl, ValidateNested } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";
import { ContentStatus } from "src/common/enums";
import { HasVideoSource } from "src/server/videos/dto/has-video-source.validator";

@HasVideoSource()
export class CreateVideoDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VideoAssetDto)
  video?: VideoAssetDto | null;

  @OptionalOrCleared()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  poster?: ImageAssetDto | null;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
