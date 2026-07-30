import { BadRequestError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { GalleryItemDto } from "src/server/doctor-profile/dto/gallery-item.dto";
import {
  DOCTOR_PROFILE_ASSET_FOLDER,
  DOCTOR_PROFILE_GALLERY_ASSET_FIELDS,
} from "src/server/doctor-profile/doctor-profile-asset-fields";
import type { GalleryItem } from "src/server/doctor-profile/doctor-profile.schema";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";

/** Adding a gallery item always appends (order = current length) — reordering is its own dedicated route. */
export async function addGalleryItem(request: NextRequest) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");

  if (!files.image) {
    throw new BadRequestError("A new gallery item requires an image.");
  }

  const profile = await getOrCreateSingleton(doctorProfileRepository, {});

  const { uploaded } = await processAssetUploadFields({
    files,
    payload,
    fields: DOCTOR_PROFILE_GALLERY_ASSET_FIELDS,
    provider: assetProvider,
    folder: DOCTOR_PROFILE_ASSET_FOLDER,
  });

  try {
    const dto = await validateDto(GalleryItemDto, payload);
    const newItem: GalleryItem = {
      id: crypto.randomUUID(),
      // processAssetUploadFields always populates payload.image when a file
      // was given, which we just required above.
      image: payload.image as GalleryItem["image"],
      altText: dto.altText,
      order: profile.gallery.length,
    };
    return await doctorProfileRepository.update({ where: {} }, { gallery: [...profile.gallery, newItem] });
  } catch (error) {
    await destroyUploadedAssets(assetProvider, uploaded);
    throw error;
  }
}
