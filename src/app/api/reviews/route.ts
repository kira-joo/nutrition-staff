import { validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { revalidateReviews } from "src/server/core/revalidation/revalidate-entity";
import { CreateReviewDto } from "src/server/reviews/dto/create-review.dto";
import { ListReviewsQueryDto } from "src/server/reviews/dto/list-reviews-query.dto";
import { REVIEW_ASSET_FIELDS, REVIEW_ASSET_FOLDER } from "src/server/reviews/review-asset-fields";
import { reviewRepository } from "src/server/reviews/reviews.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: ListReviewsQueryDto,
  auth: { permissions: [AppPermission.REVIEW.READ] },
  handler: async ({ query }) => reviewRepository.findAllAndCountPublic({ query }),
});

// No `body` here on purpose — this route always expects multipart/form-data
// (the upload-on-submit convention), so the toolkit's JSON body parser must
// never run; parseMultipartFormData() is called directly instead.
export const POST = createPostRoute({
  auth: { permissions: [AppPermission.REVIEW.CREATE] },
  handler: async ({ request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: REVIEW_ASSET_FIELDS,
      provider: assetProvider,
      folder: REVIEW_ASSET_FOLDER,
    });

    try {
      const dto = await validateDto(CreateReviewDto, payload);
      const review = await reviewRepository.save(dto);
      await revalidateReviews();
      return review;
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }
  },
});
