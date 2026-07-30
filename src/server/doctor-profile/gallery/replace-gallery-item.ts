import { NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import {
  assetProvider,
  destroyReplacedAssets,
  destroyUploadedAssets,
  processAssetUploadFields,
} from "src/server/core/assets";
import { UpdateGalleryItemDto } from "src/server/doctor-profile/dto/update-gallery-item.dto";
import {
  DOCTOR_PROFILE_ASSET_FOLDER,
  DOCTOR_PROFILE_GALLERY_ASSET_FIELDS,
} from "src/server/doctor-profile/doctor-profile-asset-fields";
import { toPlainGalleryItem, type GalleryItem } from "src/server/doctor-profile/doctor-profile.schema";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";

/** Replaces one gallery item's image and/or altText in place — never touches its position. */
export async function replaceGalleryItem(request: NextRequest, itemId: string) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");

  const profile = await doctorProfileRepository.findOne({ where: {} });
  const galleryPlain = profile.gallery.map(toPlainGalleryItem);
  const itemIndex = galleryPlain.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    throw new NotFoundError(`No gallery item exists with id "${itemId}"`, { itemId });
  }
  const previousItem = galleryPlain[itemIndex];

  const { uploaded } = await processAssetUploadFields({
    files,
    payload,
    fields: DOCTOR_PROFILE_GALLERY_ASSET_FIELDS,
    provider: assetProvider,
    folder: DOCTOR_PROFILE_ASSET_FOLDER,
  });

  let saved;
  try {
    const dto = await validateDto(UpdateGalleryItemDto, payload);
    const updatedItem: GalleryItem = {
      ...previousItem,
      altText: dto.altText ?? previousItem.altText,
      image: (payload.image as GalleryItem["image"] | undefined) ?? previousItem.image,
    };
    const nextGallery = galleryPlain.map((item, index) => (index === itemIndex ? updatedItem : item));
    saved = await doctorProfileRepository.update({ where: {} }, { gallery: nextGallery });
  } catch (error) {
    await destroyUploadedAssets(assetProvider, uploaded);
    throw error;
  }

  await destroyReplacedAssets({
    provider: assetProvider,
    fields: DOCTOR_PROFILE_GALLERY_ASSET_FIELDS,
    files,
    payload,
    previousDocument: previousItem as unknown as Record<string, unknown>,
  });

  return saved;
}
