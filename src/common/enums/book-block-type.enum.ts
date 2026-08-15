// Shared between server (DTO/asset-field/reference-check dispatch) and
// client (block registry keys, editor selection) — same reason
// CampaignBlockType lives here rather than in src/server/*.
export enum BookBlockType {
  HEADING = "heading",
  SUBHEADING = "subheading",
  PARAGRAPH = "paragraph",
  IMAGE = "image",
  BULLET_LIST = "bulletList",
  NUMBERED_LIST = "numberedList",
  CHECKLIST = "checklist",
  QUOTE = "quote",
  TIP = "tip",
  NOTE = "note",
  WARNING = "warning",
  TABLE = "table",
  DIVIDER = "divider",
  PAGE_BREAK = "pageBreak",
  QR_LINK = "qrLink",
  RECIPE_REF = "recipeRef",
  CITATION = "citation",
  PAGE_FOOTER_NOTE = "pageFooterNote",
}
