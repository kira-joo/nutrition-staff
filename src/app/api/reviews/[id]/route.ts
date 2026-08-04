import { validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import {
  assetProvider,
  destroyReplacedAssets,
  destroyUploadedAssets,
  processAssetUploadFields,
} from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { revalidateReviews } from "src/server/core/revalidation/revalidate-entity";
import { FindReviewParamsDto } from "src/server/reviews/dto/find-review-params.dto";
import { UpdateReviewDto } from "src/server/reviews/dto/update-review.dto";
import { REVIEW_ASSET_FIELDS, REVIEW_ASSET_FOLDER } from "src/server/reviews/review-asset-fields";
import { reviewRepository } from "src/server/reviews/reviews.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindReviewParamsDto,
  auth: { permissions: [AppPermission.REVIEW.READ_ONE] },
  handler: async ({ params }) => reviewRepository.findOne({ where: { _id: params.id } }),
});

// No `body` here — same multipart-only convention as the collection route.
export const PUT = createPutRoute({
  params: FindReviewParamsDto,
  auth: { permissions: [AppPermission.REVIEW.UPDATE] },
  handler: async ({ params, request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const previousDocument = await reviewRepository.findOne({ where: { _id: params.id } });

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: REVIEW_ASSET_FIELDS,
      provider: assetProvider,
      folder: REVIEW_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateReviewDto, payload);
      saved = await reviewRepository.update({ where: { _id: params.id } }, dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    // Awaited, never fire-and-forget — and only after the save has already
    // succeeded, so a cleanup failure here never rolls back the update.
    await destroyReplacedAssets({
      provider: assetProvider,
      fields: REVIEW_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    await revalidateReviews();
    return saved;
  },
});

// Soft delete — every embedded Cloudinary asset stays untouched and
// recoverable, per the asset lifecycle rules (soft delete never destroys
// assets; only a hard delete would).
export const DELETE = createDeleteRoute({
  params: FindReviewParamsDto,
  auth: { permissions: [AppPermission.REVIEW.DELETE] },
  handler: async ({ params }) => {
    await reviewRepository.softDelete({ where: { _id: params.id } });
    await revalidateReviews();
  },
});
