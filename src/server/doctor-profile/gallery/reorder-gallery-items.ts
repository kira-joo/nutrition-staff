import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { toPlainGalleryItem } from "src/server/doctor-profile/doctor-profile.schema";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";

/** Reorders the gallery to match `itemIds` exactly — a pure position change, no asset operations at all. */
export async function reorderGalleryItems(itemIds: string[]) {
  const profile = await doctorProfileRepository.findOne({ where: {} });
  const galleryPlain = profile.gallery.map(toPlainGalleryItem);
  const itemsById = new Map(galleryPlain.map((item) => [item.id, item]));

  if (itemIds.length !== galleryPlain.length || !itemIds.every((id) => itemsById.has(id))) {
    throw new BadRequestError("itemIds must be exactly the current gallery's item ids, in the new order.");
  }

  const nextGallery = itemIds.map((id, order) => ({ ...itemsById.get(id)!, order }));
  return doctorProfileRepository.update({ where: {} }, { gallery: nextGallery });
}
