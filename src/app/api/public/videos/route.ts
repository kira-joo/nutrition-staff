import { createGetRoute } from "src/server/core/route-factories";
import { PublicListVideosQueryDto } from "src/server/videos/dto/public-list-videos-query.dto";
import { videoRepository } from "src/server/videos/videos.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: PublicListVideosQueryDto,
  auth: false,
  handler: async ({ query }) =>
    videoRepository.findAllAndCountPublic({ query, where: { status: ContentStatus.PUBLISHED } }),
});
