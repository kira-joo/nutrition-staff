import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton, upsertSingleton } from "src/server/core/singleton";
import { UpdatePackagesPageSettingsDto } from "src/server/packages-page-settings/dto/update-packages-page-settings.dto";
import { packagesPageSettingsRepository } from "src/server/packages-page-settings/packages-page-settings.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: { permissions: [AppPermission.PACKAGES_PAGE_SETTINGS.READ_ONE] },
  handler: async () => getOrCreateSingleton(packagesPageSettingsRepository, {}),
});

// No assets on this entity at all — a plain JSON body, unlike Site
// Settings/Doctor Profile, needs no manual multipart parsing.
export const PUT = createPutRoute({
  body: UpdatePackagesPageSettingsDto,
  auth: { permissions: [AppPermission.PACKAGES_PAGE_SETTINGS.UPDATE] },
  handler: async ({ body }) => upsertSingleton(packagesPageSettingsRepository, body),
});
