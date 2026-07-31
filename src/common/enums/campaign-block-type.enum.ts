// Shared between server (DTO/asset-field dispatch) and client (block
// registry keys, editor selection) — same reason ContentStatus lives here
// rather than in src/server/*. One member per supported block type.
export enum CampaignBlockType {
  HERO = "hero",
  RICH_TEXT = "richText",
}
