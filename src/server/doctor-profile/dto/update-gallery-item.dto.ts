import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";

/**
 * altText is optional here (omitted = unchanged) — unlike add, replace may
 * only be swapping the image. `image` is also optional for the same reason
 * (no new file this request = keep the existing one), but must still be a
 * declared, decorated field whenever it *is* injected by
 * `processAssetUploadFields()` — see GalleryItemDto's docs.
 */
export class UpdateGalleryItemDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  altText?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto;
}
