import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

// No repository call needed — `user` is already fully resolved (roles +
// permissions populated) by authenticateRequest before this handler runs.
export const GET = createGetRoute({
  auth: true,
  handler: async ({ user }) => user,
});
