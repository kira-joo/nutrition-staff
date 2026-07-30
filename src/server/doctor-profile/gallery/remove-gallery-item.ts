import { NotFoundError, type AssetResourceType } from "@kira-joo/backend-toolkit-core";
import { AssetKind, assetProvider } from "src/server/core/assets";
import { toPlainGalleryItem } from "src/server/doctor-profile/doctor-profile.schema";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";

/** Removes one gallery item and re-normalizes the remaining items' `order` to stay contiguous. */
export async function removeGalleryItem(itemId: string) {
  const profile = await doctorProfileRepository.findOne({ where: {} });
  const galleryPlain = profile.gallery.map(toPlainGalleryItem);
  const removedItem = galleryPlain.find((item) => item.id === itemId);
  if (!removedItem) {
    throw new NotFoundError(`No gallery item exists with id "${itemId}"`, { itemId });
  }

  const nextGallery = galleryPlain.filter((item) => item.id !== itemId).map((item, order) => ({ ...item, order }));

  const saved = await doctorProfileRepository.update({ where: {} }, { gallery: nextGallery });

  // Awaited, only after the save has already succeeded — a destroy
  // failure here is logged, never rolls back the already-successful removal.
  try {
    await assetProvider.destroyAsset(removedItem.image.publicId, AssetKind.IMAGE as unknown as AssetResourceType);
  } catch (error) {
    console.error(`Failed to clean up removed gallery item asset ${removedItem.image.publicId}`, error);
  }

  return saved;
}
