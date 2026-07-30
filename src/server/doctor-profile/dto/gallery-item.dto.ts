import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import "reflect-metadata";

/**
 * Payload for adding one gallery item — `order` is never part of this DTO:
 * a new item is always appended (order = current length). Reordering is
 * its own dedicated route (`ReorderGalleryDto`).
 *
 * `image` is declared here even though the client never legitimately sends
 * it: `processAssetUploadFields()` injects the uploaded `ImageAsset` into
 * `payload.image` *before* validation, and class-validator's whitelist
 * strips (and, with `forbidNonWhitelisted`, rejects) any property with zero
 * validation decorators — same reason `ImageAssetDto` exists at all (see
 * Review's Create/UpdateReviewDto).
 */
export class GalleryItemDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  altText!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => ImageAssetDto)
  image!: ImageAssetDto;
}
