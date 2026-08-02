import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPostRoute } from "src/server/core/route-factories";
import { addGalleryItem } from "src/server/doctor-profile/gallery/add-gallery-item";

export const dynamic = "force-dynamic";

// No `body` here — multipart-only, same convention as any asset-bearing route.
export const POST = createPostRoute({
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ request }) => addGalleryItem(request),
});
