import { createGetRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { packagesPageSettingsRepository } from "src/server/packages-page-settings/packages-page-settings.repository";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as the other modules.
export const GET = createGetRoute({
  auth: false,
  handler: async () => getOrCreateSingleton(packagesPageSettingsRepository, {}),
});
