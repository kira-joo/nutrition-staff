import { createGetRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { siteSettingsRepository } from "src/server/site-settings/site-settings.repository";

// Public, unauthenticated read surface for the future nutrition-client —
// nothing consumes this yet, built now per the same "backend complete"
// convention as Review. SiteSettings has no draft/published concept (it's
// always-live site configuration, not publishable content), so the whole
// document is returned as-is.
export const GET = createGetRoute({
  auth: false,
  handler: async () => getOrCreateSingleton(siteSettingsRepository, {}),
});
