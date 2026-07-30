import { AssetKind, faviconImagePolicy, logoImagePolicy, ogImagePolicy, type AssetFieldConfig } from "src/server/core/assets";

export const SITE_SETTINGS_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "logo", kind: AssetKind.IMAGE, policy: logoImagePolicy },
  { name: "favicon", kind: AssetKind.IMAGE, policy: faviconImagePolicy },
  { name: "ogImage", kind: AssetKind.IMAGE, policy: ogImagePolicy },
];

export const SITE_SETTINGS_ASSET_FOLDER = "nutrition/site-settings";
