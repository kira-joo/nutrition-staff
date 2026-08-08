import { createGetRoute } from "src/server/core/route-factories";
import { FindVideoParamsDto } from "src/server/videos/dto/find-video-params.dto";
import { videoRepository } from "src/server/videos/videos.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindVideoParamsDto,
  auth: false,
  handler: async ({ params }) =>
    videoRepository.findOne({
      where: { _id: params.id, status: ContentStatus.PUBLISHED },
    }),
});
