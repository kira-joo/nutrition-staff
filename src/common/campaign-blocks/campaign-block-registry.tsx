import type { ComponentType } from "react";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { CampaignBlock } from "../interfaces/campaign-block.interface";
import { HeroBlockEditor } from "./hero-block-editor";
import { HeroBlockPreview } from "./hero-block-preview";
import { RichTextBlockEditor } from "./rich-text-block-editor";
import { RichTextBlockPreview } from "./rich-text-block-preview";

/**
 * The shape every block type's own Editor component conforms to
 * structurally (see e.g. `HeroBlockEditorProps`/`RichTextBlockEditorProps`)
 * — registry entries below cast their concrete Editor to this erased form,
 * the same type-erasure `Preview` already used before there were two block
 * types to prove it out.
 */
export interface CampaignBlockEditorProps<TBlock extends CampaignBlock = CampaignBlock> {
  defaultValues?: TBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

export interface CampaignBlockRegistryEntry {
  label: string;
  Editor: ComponentType<CampaignBlockEditorProps>;
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
    Editor: HeroBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: HeroBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
  [CampaignBlockType.RICH_TEXT]: {
    label: "Rich Text",
    Editor: RichTextBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: RichTextBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
};
