import { AssetKind, videoContentPolicy, videoPosterPolicy, type AssetFieldConfig } from "src/server/core/assets";

export const VIDEO_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "video", kind: AssetKind.VIDEO, policy: videoContentPolicy },
  { name: "poster", kind: AssetKind.IMAGE, policy: videoPosterPolicy },
];

export const VIDEO_ASSET_FOLDER = "nutrition/videos";
