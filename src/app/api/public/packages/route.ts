import { createGetRoute } from "src/server/core/route-factories";
import { packageRepository } from "src/server/packages/packages.repository";
import { ContentStatus } from "src/common/enums";

export const GET = createGetRoute({
  auth: false,
  handler: async () => packageRepository.findAllNoCountPublic({ where: { status: ContentStatus.PUBLISHED } }),
});
