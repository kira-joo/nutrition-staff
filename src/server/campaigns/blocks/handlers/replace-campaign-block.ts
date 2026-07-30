import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import {
  assetProvider,
  destroyReplacedAssets,
  destroyUploadedAssets,
  processAssetUploadFields,
} from "src/server/core/assets";
import { assertPublishReady } from "src/server/core/publishing";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { toPlainCampaign } from "src/server/campaigns/campaign.schema";
import { CAMPAIGN_ASSET_FOLDER, getCampaignBlockAssetFields } from "src/server/campaigns/blocks/campaign-block-asset-fields";
import type { CampaignBlock } from "src/server/campaigns/blocks/campaign-block.type";
import { validateCampaignBlock } from "src/server/campaigns/blocks/validate-campaign-block";

/**
 * Replaces one block's content in place — never touches its position or
 * its `type` (a block's type is fixed at creation; the incoming payload's
 * own `type`, if any, is ignored in favor of the existing block's).
 */
export async function replaceCampaignBlock(request: NextRequest, campaignId: string, blockId: string) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");

  const campaign = toPlainCampaign(await campaignRepository.findOne({ where: { _id: campaignId } }));
  const blockIndex = campaign.blocks.findIndex((block) => block.id === blockId);
  if (blockIndex === -1) {
    throw new NotFoundError(`No block exists with id "${blockId}"`, { blockId });
  }
  const previousBlock = campaign.blocks[blockIndex];
  payload.type = previousBlock.type;

  const assetFields = getCampaignBlockAssetFields(previousBlock.type);
  const { uploaded } = await processAssetUploadFields({
    files,
    payload,
    fields: assetFields,
    provider: assetProvider,
    folder: CAMPAIGN_ASSET_FOLDER,
  });

  let saved;
  try {
    const dto = (await validateCampaignBlock(payload)) as Omit<CampaignBlock, "id" | "order">;
    const updatedBlock: CampaignBlock = { ...dto, id: previousBlock.id, order: previousBlock.order };
    const nextBlocks = campaign.blocks.map((block, index) => (index === blockIndex ? updatedBlock : block));

    assertPublishReady({ title: campaign.title, blocks: nextBlocks }, campaign.status);

    saved = await campaignRepository.update({ where: { _id: campaignId } }, { blocks: nextBlocks });
  } catch (error) {
    await destroyUploadedAssets(assetProvider, uploaded);
    throw error;
  }

  await destroyReplacedAssets({
    provider: assetProvider,
    fields: assetFields,
    files,
    payload,
    previousDocument: previousBlock as unknown as Record<string, unknown>,
  });

  return saved;
}
