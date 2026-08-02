import { createGetRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";

export const dynamic = "force-dynamic";

// Public, unauthenticated read surface for the future nutrition-client —
// same "backend complete" convention as Review/SiteSettings. No
// draft/published concept here either.
export const GET = createGetRoute({
  auth: false,
  handler: async () => getOrCreateSingleton(doctorProfileRepository, {}),
});
