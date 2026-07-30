import { AssetKind, reviewImagePolicy, type AssetFieldConfig } from "src/server/core/assets";

/** Review's three asset fields, shared by its create/update route handlers. */
export const REVIEW_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "image", kind: AssetKind.IMAGE, policy: reviewImagePolicy },
  { name: "beforeImage", kind: AssetKind.IMAGE, policy: reviewImagePolicy },
  { name: "afterImage", kind: AssetKind.IMAGE, policy: reviewImagePolicy },
];

export const REVIEW_ASSET_FOLDER = "nutrition/reviews";
