import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { ReorderGalleryDto } from "src/server/doctor-profile/dto/reorder-gallery.dto";
import { reorderGalleryItems } from "src/server/doctor-profile/gallery/reorder-gallery-items";

export const dynamic = "force-dynamic";

export const PUT = createPutRoute({
  body: ReorderGalleryDto,
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ body }) => reorderGalleryItems(body.itemIds),
});
