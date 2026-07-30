import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { Campaign } from "../src/common/interfaces/campaign.interface";

// Header CRUD is backed by src/app/api/campaigns/**. create/update use a
// plain JSON body (a Campaign has no asset fields of its own — only its
// blocks do); the block endpoints below are the ones that go through
// buildSubmitBody()'s multipart path, same reasoning as review.endpoints.ts.

export const getCampaignsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<Campaign>;
}> = { url: "/campaigns", methodType: MethodType.GET };

export const getCampaignByIdEndpoint: Endpoint<{ params: { campaignId: string }; returnType: Campaign }> = {
  url: "/campaigns/:campaignId",
  methodType: MethodType.GET,
};

export const createCampaignEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: Campaign }> = {
  url: "/campaigns",
  methodType: MethodType.POST,
};

export const updateCampaignEndpoint: Endpoint<{
  params: { campaignId: string };
  body: Record<string, unknown>;
  returnType: Campaign;
}> = {
  url: "/campaigns/:campaignId",
  methodType: MethodType.PUT,
};

export const deleteCampaignEndpoint: Endpoint<{ params: { campaignId: string }; returnType: void }> = {
  url: "/campaigns/:campaignId",
  methodType: MethodType.DELETE,
};

export const addCampaignBlockEndpoint: Endpoint<{
  params: { campaignId: string };
  body: Record<string, unknown>;
  returnType: Campaign;
}> = {
  url: "/campaigns/:campaignId/blocks",
  methodType: MethodType.POST,
};

export const replaceCampaignBlockEndpoint: Endpoint<{
  params: { campaignId: string; blockId: string };
  body: Record<string, unknown>;
  returnType: Campaign;
}> = {
  url: "/campaigns/:campaignId/blocks/:blockId",
  methodType: MethodType.PUT,
};

export const removeCampaignBlockEndpoint: Endpoint<{
  params: { campaignId: string; blockId: string };
  returnType: Campaign;
}> = {
  url: "/campaigns/:campaignId/blocks/:blockId",
  methodType: MethodType.DELETE,
};

export const reorderCampaignBlocksEndpoint: Endpoint<{
  params: { campaignId: string };
  body: { blockIds: string[] };
  returnType: Campaign;
}> = {
  url: "/campaigns/:campaignId/blocks/reorder",
  methodType: MethodType.PUT,
};
