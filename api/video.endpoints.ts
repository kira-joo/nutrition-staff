import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Video } from "../src/common/interfaces/video.interface";

export const getVideosEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Video>;
}> = { url: "/videos", methodType: MethodType.GET };

export const getVideoByIdEndpoint: Endpoint<{ params: { id: string }; returnType: Video }> = {
  url: "/videos/:id",
  methodType: MethodType.GET,
};

export const createVideoEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: Video }> = {
  url: "/videos",
  methodType: MethodType.POST,
};

export const updateVideoEndpoint: Endpoint<{
  params: { id: string };
  body: Record<string, unknown>;
  returnType: Video;
}> = {
  url: "/videos/:id",
  methodType: MethodType.PUT,
};

export const deleteVideoEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/videos/:id",
  methodType: MethodType.DELETE,
};
