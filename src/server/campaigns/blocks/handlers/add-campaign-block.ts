import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { assertPublishReady } from "src/server/core/publishing";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { campaignRepository } from "src/server/campaigns/campaigns.repository";
import { CAMPAIGN_ASSET_FOLDER, getCampaignBlockAssetFields } from "src/server/campaigns/blocks/campaign-block-asset-fields";
import { assertValidBlockType, validateCampaignBlock } from "src/server/campaigns/blocks/validate-campaign-block";
import type { CampaignBlock } from "src/server/campaigns/blocks/campaign-block.type";

/** Adding a block always appends (order = current length) — reordering is its own dedicated route. */
export async function addCampaignBlock(request: NextRequest, campaignId: string) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");

  const campaign = await campaignRepository.findOne({ where: { _id: campaignId } });
  const assetFields = getCampaignBlockAssetFields(assertValidBlockType(payload.type));

  const { uploaded } = await processAssetUploadFields({
    files,
    payload,
    fields: assetFields,
    provider: assetProvider,
    folder: CAMPAIGN_ASSET_FOLDER,
  });

  try {
    const dto = (await validateCampaignBlock(payload)) as Omit<CampaignBlock, "id" | "order">;
    const newBlock: CampaignBlock = { ...dto, id: crypto.randomUUID(), order: campaign.blocks.length };
    const nextBlocks = [...campaign.blocks, newBlock];

    // A block can only ever be *added* to an already-published campaign in
    // an incomplete state — removing/replacing can't regress completeness,
    // but adding genuinely can, so this is the one block mutation that
    // must re-check the whole campaign, not just the header's own PUT.
    assertPublishReady({ title: campaign.title, blocks: nextBlocks }, campaign.status);

    return await campaignRepository.update({ where: { _id: campaignId } }, { blocks: nextBlocks });
  } catch (error) {
    await destroyUploadedAssets(assetProvider, uploaded);
    throw error;
  }
}
