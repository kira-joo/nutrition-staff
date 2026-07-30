import type { ComponentType } from "react";
import { CampaignBlockType } from "../enums";
import type { CampaignBlock } from "../interfaces/campaign-block.interface";
import { HeroBlockEditor, type HeroBlockEditorProps } from "./hero-block-editor";
import { HeroBlockPreview } from "./hero-block-preview";

export interface CampaignBlockRegistryEntry {
  label: string;
  Editor: ComponentType<HeroBlockEditorProps>;
  Preview: ComponentType<{ block: CampaignBlock }>;
}

/**
 * App-level, not toolkit (block editors are Campaign-specific) — one entry
 * per supported block type, per the plan. A new block type adds one entry
 * here (and one to `validateCampaignBlock`'s DTO dispatch, and one to
 * `getCampaignBlockAssetFields`'s asset dispatch) — nothing else about the
 * builder UI changes shape.
 *
 * Unlike the plan's illustrative shape, there's no separate
 * `createDefaultValue` here: each block's own Editor already supplies its
 * own empty defaults when `defaultValues` is omitted (the "add" case), so a
 * second, parallel default-value definition in the registry would just be
 * redundant with the one already inside the editor.
 */
export const campaignBlockRegistry: Record<CampaignBlockType, CampaignBlockRegistryEntry> = {
  [CampaignBlockType.HERO]: {
    label: "Hero",
    Editor: HeroBlockEditor,
    Preview: HeroBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
};
