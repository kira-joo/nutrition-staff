import { createDtoRequirednessResolver, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import { assertPublishReady } from "src/server/core/publishing";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { VIDEOS_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { CreateVideoDto } from "src/server/videos/dto/create-video.dto";
import { ListVideosQueryDto } from "src/server/videos/dto/list-videos-query.dto";
import { VIDEO_ASSET_FIELDS, VIDEO_ASSET_FOLDER } from "src/server/videos/video-asset-fields";
import { videoRepository } from "src/server/videos/videos.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListVideosQueryDto,
  auth: { permissions: [AppPermission.VIDEO.READ] },
  handler: async ({ query }) => videoRepository.findAllAndCountPublic({ query }),
});

// No `body` here on purpose — always multipart/form-data (upload-on-submit).
export const POST = createPostRoute({
  auth: { permissions: [AppPermission.VIDEO.CREATE] },
  handler: async ({ request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: VIDEO_ASSET_FIELDS,
      provider: assetProvider,
      folder: VIDEO_ASSET_FOLDER,
    });

    try {
      const dto = await validateDto(CreateVideoDto, payload);
      assertPublishReady(dto, dto.status, createDtoRequirednessResolver(CreateVideoDto, dto));
      return await videoRepository.save(dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }
  },
  revalidateTags: VIDEOS_TAGS,
});
