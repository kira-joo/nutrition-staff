import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";

/** Reorders the blocks to match `blockIds` exactly — a pure position change, no asset or content operations at all. */
export async function reorderCampaignBlocks(campaignId: string, blockIds: string[]) {
  const campaign = await campaignRepository.findOne({ where: { _id: campaignId } });
  const blocksById = new Map(campaign.blocks.map((block) => [block.id, block]));

  if (blockIds.length !== campaign.blocks.length || !blockIds.every((id) => blocksById.has(id))) {
    throw new BadRequestError("blockIds must be exactly the current campaign's block ids, in the new order.");
  }

  const nextBlocks = blockIds.map((id, order) => ({ ...blocksById.get(id)!, order }));
  return campaignRepository.update({ where: { _id: campaignId } }, { blocks: nextBlocks });
}
