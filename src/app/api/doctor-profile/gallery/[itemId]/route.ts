import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createPutRoute } from "src/server/core/route-factories";
import { DOCTOR_PROFILE_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { FindGalleryItemParamsDto } from "src/server/doctor-profile/dto/find-gallery-item-params.dto";
import { removeGalleryItem } from "src/server/doctor-profile/gallery/remove-gallery-item";
import { replaceGalleryItem } from "src/server/doctor-profile/gallery/replace-gallery-item";

export const dynamic = "force-dynamic";

// No `body` here — multipart-only, same convention as any asset-bearing route.
export const PUT = createPutRoute({
  params: FindGalleryItemParamsDto,
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ request, params }) => replaceGalleryItem(request, params.itemId),
  revalidateTags: DOCTOR_PROFILE_TAGS,
});

export const DELETE = createDeleteRoute({
  params: FindGalleryItemParamsDto,
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ params }) => removeGalleryItem(params.itemId),
  revalidateTags: DOCTOR_PROFILE_TAGS,
});
