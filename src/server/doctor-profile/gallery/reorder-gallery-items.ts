import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";

/** Reorders the gallery to match `itemIds` exactly — a pure position change, no asset operations at all. */
export async function reorderGalleryItems(itemIds: string[]) {
  const profile = await doctorProfileRepository.findOne({ where: {} });
  const itemsById = new Map(profile.gallery.map((item) => [item.id, item]));

  if (itemIds.length !== profile.gallery.length || !itemIds.every((id) => itemsById.has(id))) {
    throw new BadRequestError("itemIds must be exactly the current gallery's item ids, in the new order.");
  }

  const nextGallery = itemIds.map((id, order) => ({ ...itemsById.get(id)!, order }));
  return doctorProfileRepository.update({ where: {} }, { gallery: nextGallery });
}
