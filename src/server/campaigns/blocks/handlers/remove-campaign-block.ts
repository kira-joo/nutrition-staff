import { NotFoundError, type AssetResourceType } from "@kira-joo/backend-toolkit-core";
import { assetProvider } from "src/server/core/assets";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { getCampaignBlockAssetFields } from "src/server/campaigns/blocks/campaign-block-asset-fields";

/** Removes one block and re-normalizes the remaining blocks' `order` to stay contiguous, then destroys every asset that block owned. */
export async function removeCampaignBlock(campaignId: string, blockId: string) {
  const campaign = await campaignRepository.findOne({ where: { _id: campaignId } });
  const removedBlock = campaign.blocks.find((block) => block.id === blockId);
  if (!removedBlock) {
    throw new NotFoundError(`No block exists with id "${blockId}"`, { blockId });
  }

  const nextBlocks = campaign.blocks.filter((block) => block.id !== blockId).map((block, order) => ({ ...block, order }));
  const saved = await campaignRepository.update({ where: { _id: campaignId } }, { blocks: nextBlocks });

  // Awaited, only after the save has already succeeded — a destroy
  // failure here is logged, never rolls back the already-successful removal.
  const assetFields = getCampaignBlockAssetFields(removedBlock.type);
  const removedRecord = removedBlock as unknown as Record<string, unknown>;
  for (const field of assetFields) {
    const asset = removedRecord[field.name] as { publicId: string } | undefined;
    if (!asset) continue;
    try {
      await assetProvider.destroyAsset(asset.publicId, field.kind as unknown as AssetResourceType);
    } catch (error) {
      console.error(`Failed to clean up removed block asset ${asset.publicId}`, error);
    }
  }

  return saved;
}
