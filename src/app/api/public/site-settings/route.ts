import { createGetRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { siteSettingsRepository } from "src/server/site-settings/site-settings.repository";

// Every Route Handler in this app reads live, mutable MongoDB state (and
// authenticated ones also read request.headers via the shared auth
// pipeline) — none of them are safe candidates for static generation.
// Explicit per-file opt-out of Next's build-time static-render attempt,
// since route-segment config must be a literal export in this exact file
// (Next's static analyzer can't see through the shared route factory).
export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// nothing consumes this yet, built now per the same "backend complete"
// convention as Review. SiteSettings has no draft/published concept (it's
// always-live site configuration, not publishable content), so the whole
// document is returned as-is.
export const GET = createGetRoute({
  auth: false,
  handler: async () => getOrCreateSingleton(siteSettingsRepository, {}),
});
