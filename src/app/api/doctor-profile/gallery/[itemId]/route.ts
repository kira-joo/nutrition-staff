import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateDoctorProfile } from "src/server/core/revalidation/revalidate-entity";
import { FindGalleryItemParamsDto } from "src/server/doctor-profile/dto/find-gallery-item-params.dto";
import { removeGalleryItem } from "src/server/doctor-profile/gallery/remove-gallery-item";
import { replaceGalleryItem } from "src/server/doctor-profile/gallery/replace-gallery-item";

export const dynamic = "force-dynamic";

// No `body` here — multipart-only, same convention as any asset-bearing route.
export const PUT = createPutRoute({
  params: FindGalleryItemParamsDto,
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ request, params }) => {
    const item = await replaceGalleryItem(request, params.itemId);
    await revalidateDoctorProfile();
    return item;
  },
});

export const DELETE = createDeleteRoute({
  params: FindGalleryItemParamsDto,
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ params }) => {
    const result = await removeGalleryItem(params.itemId);
    await revalidateDoctorProfile();
    return result;
  },
});
