import { validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import {
  assetProvider,
  destroyReplacedAssets,
  destroyUploadedAssets,
  processAssetUploadFields,
} from "src/server/core/assets";
import { assertPublishReady } from "src/server/core/publishing";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { VIDEOS_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { FindVideoParamsDto } from "src/server/videos/dto/find-video-params.dto";
import { UpdateVideoDto } from "src/server/videos/dto/update-video.dto";
import { VIDEO_ASSET_FIELDS, VIDEO_ASSET_FOLDER } from "src/server/videos/video-asset-fields";
import { videoRepository } from "src/server/videos/videos.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindVideoParamsDto,
  auth: { permissions: [AppPermission.VIDEO.READ_ONE] },
  handler: async ({ params }) => videoRepository.findOne({ where: { _id: params.id } }),
});

// No `body` here — same multipart-only convention as the collection route.
export const PUT = createPutRoute({
  params: FindVideoParamsDto,
  auth: { permissions: [AppPermission.VIDEO.UPDATE] },
  handler: async ({ params, request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const previousDocument = await videoRepository.findOne({ where: { _id: params.id } });

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: VIDEO_ASSET_FIELDS,
      provider: assetProvider,
      folder: VIDEO_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateVideoDto, payload);
      const nextStatus = dto.status ?? previousDocument.status;
      assertPublishReady({ ...previousDocument, ...dto }, nextStatus);
      saved = await videoRepository.update({ where: { _id: params.id } }, dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    await destroyReplacedAssets({
      provider: assetProvider,
      fields: VIDEO_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    return saved;
  },
  revalidateTags: VIDEOS_TAGS,
});

export const DELETE = createDeleteRoute({
  params: FindVideoParamsDto,
  auth: { permissions: [AppPermission.VIDEO.DELETE] },
  handler: async ({ params }) => {
    await videoRepository.softDelete({ where: { _id: params.id } });
  },
  revalidateTags: VIDEOS_TAGS,
});
