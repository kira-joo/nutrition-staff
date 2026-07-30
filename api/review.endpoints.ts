import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Review } from "../src/common/interfaces/review.interface";

// Backed by the multipart-upload-on-submit route handlers under src/app/api/reviews.
// create/update bodies are typed loosely (Record<string, unknown>) rather than as
// CreateReviewDto/UpdateReviewDto: CustomForm's buildSubmitBody() turns a form with
// any IMAGE_ASSET/VIDEO_ASSET field into a FormData body at the requester layer,
// which doesn't correspond to either DTO's own (JSON) shape.

export const getReviewsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Review>;
}> = { url: "/reviews", methodType: MethodType.GET };

export const getReviewByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Review }> = {
  url: "/reviews/:id",
  methodType: MethodType.GET,
};

export const createReviewEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: Review }> = {
  url: "/reviews",
  methodType: MethodType.POST,
};

export const updateReviewEndpoint: Endpoint<{
  params: { id: string };
  body: Record<string, unknown>;
  returnType: Review;
}> = {
  url: "/reviews/:id",
  methodType: MethodType.PUT,
};

export const deleteReviewEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/reviews/:id",
  methodType: MethodType.DELETE,
};
