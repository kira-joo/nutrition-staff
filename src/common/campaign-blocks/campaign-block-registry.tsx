import type { ComponentType } from "react";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { CampaignBlock } from "../interfaces/campaign-block.interface";
import { CountdownBlockEditor } from "./countdown-block-editor";
import { CountdownBlockPreview } from "./countdown-block-preview";
import { CtaBlockEditor } from "./cta-block-editor";
import { CtaBlockPreview } from "./cta-block-preview";
import { FaqRefBlockEditor } from "./faq-ref-block-editor";
import { FaqRefBlockPreview } from "./faq-ref-block-preview";
import { FeatureGridBlockEditor } from "./feature-grid-block-editor";
import { FeatureGridBlockPreview } from "./feature-grid-block-preview";
import { HeroBlockEditor } from "./hero-block-editor";
import { HeroBlockPreview } from "./hero-block-preview";
import { MediaBlockEditor } from "./media-block-editor";
import { MediaBlockPreview } from "./media-block-preview";
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
  [CampaignBlockType.FEATURE_GRID]: {
    label: "Feature Grid",
    Editor: FeatureGridBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: FeatureGridBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
  [CampaignBlockType.MEDIA]: {
    label: "Media",
    Editor: MediaBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: MediaBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
  [CampaignBlockType.CTA]: {
    label: "Call to Action",
    Editor: CtaBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: CtaBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
  [CampaignBlockType.FAQ_REF]: {
    label: "FAQ Reference",
    Editor: FaqRefBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: FaqRefBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
  [CampaignBlockType.COUNTDOWN]: {
    label: "Countdown",
    Editor: CountdownBlockEditor as ComponentType<CampaignBlockEditorProps>,
    Preview: CountdownBlockPreview as ComponentType<{ block: CampaignBlock }>,
  },
};
