import { AssetKind, campaignHeroPolicy, type AssetFieldConfig } from "src/server/core/assets";
import { CampaignBlockType } from "src/common/enums";

/** Per-block-type asset field config — a future block type with no assets at all would map to an empty array here. */
const BLOCK_ASSET_FIELDS_BY_TYPE: Record<CampaignBlockType, readonly AssetFieldConfig[]> = {
  [CampaignBlockType.HERO]: [{ name: "image", kind: AssetKind.IMAGE, policy: campaignHeroPolicy }],
  [CampaignBlockType.RICH_TEXT]: [],
};

export function getCampaignBlockAssetFields(type: CampaignBlockType): readonly AssetFieldConfig[] {
  return BLOCK_ASSET_FIELDS_BY_TYPE[type];
}

export const CAMPAIGN_ASSET_FOLDER = "nutrition/campaigns";
