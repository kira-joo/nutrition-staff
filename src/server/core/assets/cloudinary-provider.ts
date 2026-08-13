import { createCloudinaryProvider } from "@kira-joo/backend-toolkit-cloudinary";
import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import { destroyAssetUnlessPublished } from "./destroy-asset-unless-published";

// Credentials are read once, from environment variables only — the provider
// itself never hardcodes or embeds them (see @kira-joo/backend-toolkit-cloudinary's
// own docs). This app is the only place that knows these values exist.
const rawCloudinaryProvider = createCloudinaryProvider({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * `assetProvider` is guarded, app-wide, at this one export — every
 * existing caller (Recipes, Doctor Profile, Videos, Packages, Books, and
 * anything added later) automatically gets the published-Edition asset
 * check on every destroy, with no per-module changes. See
 * `destroy-asset-unless-published.ts` for exactly what the guard does and
 * why its failure mode is "log loudly and destroy normally," not "fail
 * closed." Uploads are untouched — the guard only ever wraps `destroyAsset`.
 */
export const assetProvider: AssetProvider = {
  uploadImage: rawCloudinaryProvider.uploadImage,
  uploadVideo: rawCloudinaryProvider.uploadVideo,
  destroyAsset: (publicId, resourceType) => destroyAssetUnlessPublished(rawCloudinaryProvider, publicId, resourceType),
};
