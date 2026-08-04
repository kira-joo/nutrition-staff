import { createGetRoute } from "src/server/core/route-factories";
import { getPublicFaq } from "src/server/faq/get-public-faq";

export const dynamic = "force-dynamic";

// Supersedes the old /api/public/faq-sections + /api/public/faq-items
// pair — sections and items are already joined, ordered, and filtered to
// published-only here, so the public website never repeats that merge.
export const GET = createGetRoute({
  auth: false,
  handler: async () => getPublicFaq(),
});
