import { createDtoRequirednessResolver } from "@kira-joo/backend-toolkit-core";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import { BLOCK_DTO_BY_TYPE } from "src/server/campaigns/blocks/validate-campaign-block";
import type { CampaignBlock } from "src/server/campaigns/blocks/campaign-block.type";
import { CreateCampaignDto } from "src/server/campaigns/dto/create-campaign.dto";

/**
 * Builds the `isRequired` resolver `assertPublishReady` needs for a
 * Campaign's `{title, blocks}` shape.
 *
 * There's no single create DTO covering both — a Campaign is always
 * created block-less (`CreateCampaignDto` has no `blocks` field; blocks
 * are only ever added via their own sub-resource routes) — so `title`
 * resolves against `CreateCampaignDto` like every other module, and each
 * block resolves against its own concrete block DTO via the same
 * `BLOCK_DTO_BY_TYPE` dispatch table `validateCampaignBlock` already uses
 * for real create/replace validation, not a second type-to-DTO mapping.
 */
export function resolveCampaignRequiredness(entity: {
  title: LocalizedString;
  blocks: CampaignBlock[];
}): (path: string) => boolean {
  const titleResolver = createDtoRequirednessResolver(CreateCampaignDto, { title: entity.title });
  const blockResolvers = entity.blocks.map((block) =>
    createDtoRequirednessResolver(BLOCK_DTO_BY_TYPE[block.type], block)
  );

  return function isRequired(path: string): boolean {
    if (path === "title") return titleResolver("title");

    const match = /^blocks\.(\d+)\.(.+)$/.exec(path);
    if (!match) return true;

    const resolver = blockResolvers[Number(match[1])];
    return resolver ? resolver(match[2]) : true;
  };
}
